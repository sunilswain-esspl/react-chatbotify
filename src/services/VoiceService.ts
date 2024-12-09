import { RefObject, Dispatch, SetStateAction } from "react";
import { Settings } from "../types/Settings";
import axios from "axios";

let toggleOn = false;
// 
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: BlobPart[] = [];

/**
 * Starts recording user voice input with microphone.
 * 
 * @param settings options provided to the bot
 * @param toggleVoice handles toggling of voice
 * @param triggerSendVoiceInput triggers sending of voice input into chat window
 * @param setInputLength sets the input length to reflect character count & limit
 * @param audioChunksRef: reference to audio chunks
 * @param inputRef reference to textarea for input
 * 
 */
export const startVoiceRecording = (
	settings: Settings,
	toggleVoice: () => Promise<void>,
	triggerSendVoiceInput: () => void,
	setTextAreaValue: (value: string) => void,
	setInputLength: Dispatch<SetStateAction<number>>,
	inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
) => {
	navigator.mediaDevices.getUserMedia({ audio: true })
		.then(stream => {
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = []; // Reset audio chunks on each recording

			// Start recording
			if (!toggleOn) {
				try {
					toggleOn = true;
					mediaRecorder.start();
				} catch {
					// Catches rare DOM exceptions if user spams voice button
				}
			}

			mediaRecorder.ondataavailable = event => {
				audioChunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				// Stop the microphone stream
				stream.getTracks().forEach(track => track.stop());

				// Process the audio after stopping the mic
				await processAudioAfterStop(settings, setTextAreaValue, setInputLength, inputRef);
			};
		})
		.catch(error => {
			console.error("Unable to use microphone:", error);
		});
};

/**
 * Processes the recorded audio after mic is turned off.
 * Sends the audio to the transcription API and updates the input field.
 *
 * @param settings options provided to the bot
 * @param setTextAreaValue sets the input value
 * @param setInputLength sets the input length to reflect character count & limit
 * @param inputRef reference to textarea for input
 */
const processAudioAfterStop = async (
	settings: Settings,
	setTextAreaValue: (value: string) => void,
	setInputLength: Dispatch<SetStateAction<number>>,
	inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
) => {
	if (audioChunks.length === 0) {
		console.warn("No audio chunks available to process.");
		return;
	}

	try {
		// Merge audio chunks and create a Blob
		const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

		// Create a FormData object to send audio
		const formData = new FormData();
		formData.append("file", audioBlob, "audio.wav");

		// Make the API request
		const response = await axios.post("http://127.0.0.1:4557/transcribe/", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		console.log(response)
		
		// Handle the API response
		const transcription = response.data.transcription || ""; // Replace with actual key from your API
		if (inputRef.current) {
			const characterLimit = settings.chatInput?.characterLimit;
			const newInput = inputRef.current.value + transcription;

			if (characterLimit != null && characterLimit >= 0 && newInput.length > characterLimit) {
				setTextAreaValue(newInput.slice(0, characterLimit));
			} else {
				setTextAreaValue(newInput);
			}
			setInputLength(inputRef.current.value.length);
		}
	} catch (error) {
		console.error("Error during transcription:", error);
	}
};


// /**
//  * Starts voice recording for input into textarea using custom API.
//  *
//  * @param settings options provided to the bot
//  * @param toggleVoice handles toggling of voice
//  * @param triggerSendVoiceInput triggers sending of voice input into chat window
//  * @param setTextAreaValue sets the input value
//  * @param setInputLength sets the input length to reflect character count & limit
//  * @param audioChunksRef reference to recorded audio chunks
//  * @param inputRef reference to textarea for input
//  */
// const startTranscriptionUsingApi = async (
// 	settings: Settings,
// 	toggleVoice: () => Promise<void>,
// 	triggerSendVoiceInput: () => void,
// 	setTextAreaValue: (value: string) => void,
// 	setInputLength: Dispatch<SetStateAction<number>>,
// 	audioChunksRef: RefObject<BlobPart[]>,
// 	inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
// ) => {
// 	if (!toggleOn) {
// 		try {
// 			toggleOn = true;

// 			// Merge audio chunks and create a Blob
// 			const audioBlob = new Blob(audioChunksRef.current || [], { type: "audio/wav" });

// 			// Create a FormData object to send audio
// 			const formData = new FormData();
// 			formData.append("file", audioBlob, "audio.wav");

// 			// Make the API request
// 			const response = await axios.post("http://127.0.0.1:4557/transcribe/", formData, {
// 				headers: { "Content-Type": "multipart/form-data" },
// 			});

// 			// Handle the API response
// 			const transcription = response.data.transcription || ""; // Replace with actual key from your API
// 			if (inputRef.current) {
// 				const characterLimit = settings.chatInput?.characterLimit;
// 				const newInput = inputRef.current.value + transcription;

// 				if (characterLimit != null && characterLimit >= 0 && newInput.length > characterLimit) {
// 					setTextAreaValue(newInput.slice(0, characterLimit));
// 				} else {
// 					setTextAreaValue(newInput);
// 				}
// 				setInputLength(inputRef.current.value.length);
// 			}

// 			// Automatically send input if settings allow
// 			if (!settings.voice?.autoSendDisabled) {
// 				autoSendTimer = setTimeout(triggerSendVoiceInput, settings.voice?.autoSendPeriod);
// 			}
// 		} catch (error) {
// 			console.error("Error during transcription:", error);
// 		} finally {
// 			toggleOn = false;
// 		}
// 	}

// 	// Handle inactivity timeout
// 	if (!inactivityTimer) {
// 		inactivityTimer = setTimeout(
// 			async () => await handleTimeout(toggleVoice, inputRef), settings.voice?.timeoutPeriod
// 		);
// 	}
// };

/**
 * Starts voice recording for sending as audio file (auto send does not work for media recordings).
 *
 * @param triggerSendVoiceInput triggers sending of voice input into chat window
 * @param audioChunksRef: reference to audio chunks
 */
// const startAudioRecording = (
// 	triggerSendVoiceInput: () => void,
// 	audioChunksRef: RefObject<BlobPart[]>
// ) => {
// 	navigator.mediaDevices.getUserMedia({ audio: true })
// 		.then(stream => {
// 			mediaRecorder = new MediaRecorder(stream);

// 			if (!toggleOn) {
// 				try {
// 					toggleOn = true;
// 					mediaRecorder.start();
// 				} catch {
// 					// catches rare DOM exception if user spams voice button
// 				}
// 			}

// 			mediaRecorder.ondataavailable = event => {
// 				if (audioChunksRef.current) {
// 					audioChunksRef.current.push(event.data);
// 				}
// 			};

// 			mediaRecorder.onstop = () => {
// 				triggerSendVoiceInput();
// 				stream.getTracks().forEach(track => track.stop());
// 			};
// 		})
// 		.catch(error => {
// 			console.error("Unable to use microphone:", error);
// 		});
// };

export const stopVoiceRecording = () => {
	if (mediaRecorder && mediaRecorder.state !== "inactive") {
		mediaRecorder.stop();
		mediaRecorder = null;
	}
	toggleOn = false;
};

/**
 * Syncs voice toggle to textarea state (voice should not be enabled if textarea is disabled).
 * 
 * @param keepVoiceOn boolean indicating if voice was on and thus is to be kept toggled on
 * @param settings options provided to the bot
 */
export const syncVoiceWithChatInput = (keepVoiceOn: boolean, settings: Settings) => {
	if (settings.voice?.disabled || !settings.chatInput?.blockSpam) {
		return;
	}

	if (keepVoiceOn && !toggleOn) {
		toggleOn = true;
		mediaRecorder?.start();
	} else if (!keepVoiceOn) {
		stopVoiceRecording();
	}
};
/**
 * Handles timeout for automatically turning off voice.
 * 
 * @param handleToggleVoice handles toggling of voice
 */
// const handleTimeout = async (
// 	toggleVoice: () => Promise<void>,
// 	inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
// ) => {
// 	if (!inputRef.current?.disabled) {
// 		await toggleVoice();
// 	}
// 	stopVoiceRecording();
// };

// import { useState } from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import axios from "axios";


function App() {
	// const [message, setMessage] = useState("")

	const fetchResponse = async (userInput: string): Promise<string> => {
		const token = import.meta.env?.VITE_PROJECT_AI_API_TOKEN;
		console.log(token)
		const apiEndpoint = "http://192.168.6.107:8100/chat"; // Replace <your-ip> with the actual IP or hostname

		try {
			// Validate token
			if (!token) {
				throw new Error("Unauthorized: Token is missing.");
			}

			// Call the API with user input
			const response = await axios.post(
				apiEndpoint,
				{ message: userInput },
				{
					headers: {
						"Access-Token": token,
					},
				}
			);

			// Return the bot's response or a default message
			return response.data || "No response received.";
		} catch (error) {
			console.error("Error fetching bot response:", error);
			return "Error fetching response. Please try again.";
		}
	};

	// Serves as an example flow used during the development phase - covers all possible attributes in a block.
	// restore to default state before running selenium tests (or update the test cases if necessary)!
	const flow: Flow = {
		start: {
			message: "Hello! How can I help you?",
			path: "bot_reply",
		},
		bot_reply: {
			message: async (params: Params) => {
				if (params.prevPath == "ask_preference") {
					return;
				}
				else {
					if (params.userInput == "/help") {
						return;
					}
					else {
						return await fetchResponse(params.userInput)
					}
				}
			},
			// function: (params: Params) => setMessage(params.userInput),
			// transition: { duration: 500 }, IMPORTANT: turning this on starts loop
			path: (params: Params) => {
				if (params.userInput != "/help") {
					return "bot_reply"
				} else {
					return "help";
				}
			},
		},
		help: {
			message: () => `Here are the available actions you can perform,`,
			options: ["Change Preference"],
			chatDisabled: true,
			path: () => "ask_preference",
		},
		ask_preference: {
			message: "Choose your preferences",
			checkboxes: {items: [
				"Leadership",
				"Personal",
				"Teams",
				"Learning",
				"Meetings",
				"Fundamentals"
			], min:1},
			function: (params: Params) => alert(`You picked: ${JSON.stringify(params.userInput)}!`),
			chatDisabled: true,
			path: "bot_reply",
		},
		
		// ask_token: {
		// 	message: () => "Before we proceed, we need to verify your profile id, "
		// 	+ "Enter your 6 digit profile id",
		// 	isSensitive: true,
		// 	path: (params: Params) => {
		// 		if (params.userInput.length !== 6) {
		// 			return "incorrect_answer"
		// 		} else {
		// 			return "ask_age_group";
		// 		}
		// 	},
		// },
		// ask_age_group: {
		// 	message: () => `Hey ${name}!, Your account got verified, May i know your age group?`,
		// 	options: ["child", "teen", "adult"],
		// 	chatDisabled: true,
		// 	path: () => "ask_math_question",
		// },
		// ask_math_question: {
		// 	message: (params: Params) => {
		// 		if (params.prevPath == "incorrect_answer") {
		// 			return;
		// 		}
		// 		return `I see you're a ${params.userInput}. Let's do a quick test! What is 1 + 1?`
		// 	},
		// 	path: (params: Params) => {
		// 		if (params.userInput != "2") {
		// 			return "incorrect_answer"
		// 		} else {
		// 			return "ask_favourite_color";
		// 		}
		// 	},
		// },
		// ask_favourite_color: {
		// 	message: "Great Job! What is your favourite color?",
		// 	path: "ask_favourite_pet"
		// },
		// ask_favourite_pet: {
		// 	message: "Interesting! Pick any 2 pets below.",
		// 	checkboxes: {items: ["Dog", "Cat", "Rabbit", "Hamster"], min:2, max: 2},
		// 	function: (params: Params) => alert(`You picked: ${JSON.stringify(params.userInput)}!`),
		// 	chatDisabled: true,
		// 	path: "ask_height",
		// },
		// ask_height: {
		// 	message: "What is your height (cm)?",
		// 	path: async (params: Params) => {
		// 		if (isNaN(Number(params.userInput))) {
		// 			await params.injectMessage("Height needs to be a number!");
		// 			return;
		// 		}
		// 		return "ask_weather";
		// 	}
		// },
		// ask_weather: {
		// 	message: (params: Params) => {
		// 		if (params.prevPath == "incorrect_answer") {
		// 			return;
		// 		}
		// 		return "What's my favourite color? Click the button below to find out my answer!"
		// 	},
		// 	component: (
		// 		<div style={{
		// 			width: "100%",
		// 			display: "flex",
		// 			alignItems: "center",
		// 			justifyContent: "center",
		// 			marginTop: 10
		// 		}}>
		// 			<button 
		// 				className="secret-fav-color"
		// 				onClick={() => alert("black")}>
		// 				Click me!
		// 			</button>
		// 		</div>
		// 	),
		// 	path: async (params: Params) => {
		// 		if (params.userInput.toLowerCase() != "black") {
		// 			return "incorrect_answer"
		// 		} else {
		// 			await params.openChat(false);
		// 			return "close_chat";
		// 		}
		// 	},
		// },
		// close_chat: {
		// 	message: "I went into hiding but you found me! Ok tell me, "+
		// 		"<b class='bold'>what's your favourite food?</b>",
		// 	path: "ask_image"
		// },
		// ask_image: {
		// 	message: (params: Params) =>
		// 		`${params.userInput}? Interesting. Could you share an image of that?`,
		// 	file: (params: Params) => console.log(params.files),
		// 	function: (params: Params) =>
		// 		params.showToast("Image is uploaded successfully!"),
		// 	path: "end",
		// },
		// end: {
		// 	message: "Thank you for sharing! See you again!",
		// 	path: "loop"
		// },
		// loop: {
		// 	message: (params: Params) => {
		// 		// sends the message half a second later to facilitate testing of new message prompt
		// 		setTimeout(async () => {
		// 			await params.injectMessage("You have reached the end of the conversation!");
		// 		}, 500)
		// 	},
		// 	path: "loop"
		// },
		// incorrect_answer: {
		// 	message: "Your answer is incorrect, try again!",
		// 	transition: {duration: 0},
		// 	path: (params: Params) => params.prevPath
		// },
	}

	return (
		<div className="App">
			<header className="App-header">
				<div style={
					{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: `calc(20vh)` }
				}>
					<ChatBot
						id="chatbot-id"
						flow={flow}
						settings={{
							audio: { disabled: false },
							chatInput: { botDelay: 1000 },
							userBubble: { showAvatar: true, dangerouslySetInnerHtml: true },
							botBubble: { showAvatar: true, dangerouslySetInnerHtml: true },
							voice: { disabled: false },
							sensitiveInput: { asterisksCount: 6 },
						}}
					></ChatBot>
				</div>
			</header>
		</div>
	);
}

export default App;
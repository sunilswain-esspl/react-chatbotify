import {
	saveChatHistory,
	loadChatHistory,
	getHistoryMessages,
	setHistoryMessages,
	clearHistoryMessages,
	setHistoryStorageValues,
} from "../../src/services/ChatHistoryService";
import { Message } from "../../src/types/Message";
import { Settings } from "../../src/types/Settings";

jest.useFakeTimers();

describe("ChatHistoryService", () => {

	const mockMessage: Message = {
		id: "1",
		sender: "USER",
		content: "Hello good sir!",
		type: "text",
		timestamp: "2021-01-01T00:00:00Z",
	};

	const mockSettings = (storageType: string): Settings => ({
		chatHistory: {
			storageType: storageType,
			storageKey: "rcb-history",
			maxEntries: 30,
			disabled: false,
			autoLoad: false,
		},
	});

	// Setup
	beforeAll(() => {
		global.Storage.prototype.setItem = jest.fn();
		global.Storage.prototype.getItem = jest.fn();
		global.Storage.prototype.removeItem = jest.fn();
	});

	
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// teardown
	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe.each([
		[ "LOCAL_STORAGE", localStorage ],
		[ "SESSION_STORAGE", sessionStorage ],
	])("saveChatHistory in %s", (storageType, storage) => {
		it("should not save history if disabled", async () => {
			const settings = {
				...mockSettings(storageType),
				chatHistory: { ...mockSettings(storageType).chatHistory, disabled: true },
			};

			setHistoryStorageValues(settings);
			await saveChatHistory([mockMessage]);
			expect(storage.setItem).not.toHaveBeenCalled();
		});

		it("should save history if not disabled", async () => {
			setHistoryStorageValues(mockSettings(storageType));
			await saveChatHistory([mockMessage]);
			
			expect(storage.setItem).toHaveBeenCalled();
		});

		it("should handle empty message array without errors", async () => {
			setHistoryStorageValues(mockSettings(storageType));
			await saveChatHistory([]);
			expect(storage.setItem).toHaveBeenCalled();
		});

		it("should limit the number of messages saved according to maxEntries", async () => {
			const maxEntriesSettings = {
				...mockSettings(storageType),
				chatHistory: 
				{ ...mockSettings(storageType).chatHistory,
					maxEntries: 1 
				},
			};
			setHistoryStorageValues(maxEntriesSettings);

			const extraMessage = { ...mockMessage, id: "2" };
			await saveChatHistory([mockMessage, extraMessage]);

			const savedData = JSON.parse((localStorage.setItem as jest.Mock).mock.calls[0][1]);
			expect(savedData).toHaveLength(1);
			expect(savedData[0].id).toBe("2");
		});
	});

	describe.each([
		[ "LOCAL_STORAGE", localStorage ],
		[ "SESSION_STORAGE", sessionStorage ],
	])("loadChatHistory", (storageType, storage) => {
		it("should load history and display messages", () => {
			const setMessages = jest.fn();
			const setIsLoadingChatHistory = jest.fn();
			
			// Mock the div element for chatBodyRef
			const divElement = document.createElement("div");
			Object.defineProperty(divElement, "scrollHeight", { value: 1000 });
			divElement.scrollTop = 500;
		
			const chatBodyRef = {
				current: divElement
			};
		
			loadChatHistory(
				mockSettings(storageType),
				{},
				[mockMessage],
				setMessages,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory
			);
		
			// Fast-forward until all timers have been executed
			jest.runAllTimers();
		
			expect(setMessages).toHaveBeenCalled();
			expect(setIsLoadingChatHistory).toHaveBeenCalledWith(false);
		});

		it("should handle corrupted data by clearing it from storage", () => {
			storage.setItem("rcb-history", "not_json_format");
	
			const setMessages = jest.fn();
			const setIsLoadingChatHistory = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };
	
			// verify it doesn't throw
			expect(() =>
				loadChatHistory(
					mockSettings(storageType),
					{},
					[],
					setMessages,
					chatBodyRef,
					1000,
					setIsLoadingChatHistory
				)
			).not.toThrow();
		});

		it("does not do anything if chat history is null", () => {
			const setMessages = jest.fn();
			const setIsLoadingChatHistory = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };
	
			loadChatHistory(
				mockSettings(storageType),
				{},
				null as unknown as Message[],
				setMessages,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory
			);
	
			expect(setMessages).not.toHaveBeenCalled();
		});

		it("handles errors gracefully and removes chat history on error", () => {
			const setMessages = () => { throw new Error("Error setting messages"); };
			const setIsLoadingChatHistory = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };
	
			loadChatHistory(
				mockSettings(storageType),
				{},
				[],
				setMessages,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory
			);
	
			expect(storage.removeItem).toHaveBeenCalledWith(mockSettings(storageType).chatHistory?.storageKey);
		});
	});

	describe("clearHistoryMessages", () => {
		it("should clear history messages", () => {
			clearHistoryMessages();

			expect(localStorage.removeItem).toHaveBeenCalledWith("rcb-history");
			expect(sessionStorage.removeItem).toHaveBeenCalledWith("rcb-history");
		});
	});

	describe("setHistoryStorageValues", () => {
		it.each([
			[ "LOCAL_STORAGE", localStorage ],
			[ "SESSION_STORAGE", sessionStorage ],
		])("should set storage values correctly in %s", (storageType, storage) => {
			setHistoryStorageValues(mockSettings(storageType));

			expect(storage.getItem).toHaveBeenCalledWith("rcb-history");
		});

		it("should handle invalid storage type by defaulting to local storage", () => {
			const invalidSettings = { 
				...mockSettings, chatHistory: 
				{ ...mockSettings("INVALID_TYPE").chatHistory } 
			};

			setHistoryStorageValues(invalidSettings);

			// Defaults to localStorage
			expect(localStorage.getItem).toHaveBeenCalledWith("rcb-history");  
		});
	});

	describe("getHistoryMessages", () => {
		it("should retrieve history messages", () => {
			setHistoryStorageValues(mockSettings("LOCAL_STORAGE"));
			setHistoryStorageValues(mockSettings("SESSION_STORAGE"));

			const historyMessages = getHistoryMessages();
			expect(historyMessages).toEqual([]);
		});
	});

	describe.each([
		[ "LOCAL_STORAGE", localStorage ],
		[ "SESSION_STORAGE", sessionStorage ],
	])("setHistoryMessages in %s", (storageType, storage) => {
		it("should set history messages", () => {
			setHistoryStorageValues(mockSettings(storageType));
			setHistoryMessages([mockMessage]);

			expect(storage.setItem).toHaveBeenCalledWith(
				"rcb-history",
				JSON.stringify([mockMessage])
			);
		});
	});
});

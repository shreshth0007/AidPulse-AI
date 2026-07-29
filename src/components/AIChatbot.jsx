import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Mic, MicOff, Volume2, ShieldAlert, Sparkles, Key, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { TRANSLATIONS, SHELTERS, HOSPITALS } from '../data/mockDisasterData';
import { callGeminiDisasterAI } from '../services/geminiService';

export default function AIChatbot({ currentLang, onNavigateTab, onOpenSOS, selectedShelterContext, presetQuery }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  useEffect(() => {
    if (presetQuery && presetQuery.trim()) {
      handleSendMessage(presetQuery);
    }
  }, [presetQuery]);
  
  // Load initial API key from localStorage or .env if present
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
  );
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('gemini_api_key') && !import.meta.env.VITE_GEMINI_API_KEY);
  const [isKeySaved, setIsKeySaved] = useState(!!localStorage.getItem('gemini_api_key') || !!import.meta.env.VITE_GEMINI_API_KEY);
  const [apiError, setApiError] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: currentLang === 'hi' 
        ? "नमस्ते! मैं आपका AidPulse AI आपातकालीन सहायक हूँ। (Gemini 1.5 Flash संचालित)। मुझे बताएं कि आपकी आपातकालीन स्थिति क्या है।"
        : currentLang === 'es'
        ? "¡Hola! Soy su Asistente de Emergencia AidPulse AI (Impulsado por Gemini 1.5 Flash). Indique su situación de emergencia."
        : "Hello! I am your AidPulse AI Emergency Assistant (Powered by Google Gemini 1.5 Flash). Tell me your emergency situation for high-precision, life-saving guidance.",
      actions: [
        { label: "📍 Find Nearest Shelter", tab: "map" },
        { label: "🚨 Trigger SOS Rescue", action: "sos" },
        { label: "🏥 Check Available Hospital Beds", tab: "medical" }
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAI]);

  useEffect(() => {
    if (selectedShelterContext) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `Evacuation Route generated for **${selectedShelterContext.name}** (${selectedShelterContext.distanceKm} km away).\nStatus: ${selectedShelterContext.status} (${selectedShelterContext.availableBeds} beds available).\nAddress: ${selectedShelterContext.address}.`,
          actions: [
            { label: "📞 Call Shelter", phone: selectedShelterContext.phone },
            { label: "🗺️ View on Map", tab: "map" }
          ]
        }
      ]);
    }
  }, [selectedShelterContext]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsKeySaved(true);
      setApiError('');
      setShowKeyInput(false);
    } else {
      localStorage.removeItem('gemini_api_key');
      setIsKeySaved(false);
    }
  };

  // Voice Recognition
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'es' ? 'es-ES' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Text to Speech
  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'es' ? 'es-ES' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Fallback offline generator if Gemini key is absent or API fails
  const generateOfflineFallback = (userText) => {
    const lower = userText.toLowerCase();

    if (lower.includes('trap') || lower.includes('flood') || lower.includes('water')) {
      return {
        text: "⚠️ **CRITICAL FLOOD SAFETY TRIAGE (Offline Rule Engine)**:\n1. Move to the highest available roof/elevated ground immediately.\n2. Do NOT switch on electrical breakers or touch submerged wiring.\n3. Whistle or flash lights to signal rescue boats.\n\n*Tip: Connect a Gemini API Key above for AI live precision guidance.*",
        actions: [
          { label: "🚨 Broadcast SOS Rescue Now", action: "sos" },
          { label: "🗺️ View Elevated Safe Shelters", tab: "map" }
        ]
      };
    }

    if (lower.includes('shelter') || lower.includes('safe zone')) {
      const bestShelter = SHELTERS[0];
      return {
        text: `🏠 **NEAREST SHELTER**: **${bestShelter.name}** (${bestShelter.distanceKm} km away).\nStatus: ${bestShelter.status} (${bestShelter.availableBeds} beds free).`,
        actions: [
          { label: "🗺️ Open Interactive Map", tab: "map" },
          { label: `📞 Call ${bestShelter.name}`, phone: bestShelter.phone }
        ]
      };
    }

    return {
      text: `AidPulse Offline Response: Priority triage instructions active. For AI precision reasoning, enter your Gemini API key in the top settings bar.`,
      actions: [
        { label: "🗺️ Locate Nearest Shelters", tab: "map" },
        { label: "🚨 Send SOS Dispatch", action: "sos" }
      ]
    };
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setApiError('');
    setIsLoadingAI(true);

    try {
      if (apiKey && apiKey.trim()) {
        // Call Real Gemini API
        const geminiResult = await callGeminiDisasterAI(textToSend, apiKey, currentLang);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            isGemini: true,
            text: geminiResult.text,
            actions: geminiResult.actions
          }
        ]);
      } else {
        // Fallback to offline agent
        const offlineReply = generateOfflineFallback(textToSend);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            isGemini: false,
            text: offlineReply.text,
            actions: offlineReply.actions
          }
        ]);
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to offline triage:", err);
      setApiError(err.message || "Gemini API error. Used offline fallback.");
      
      const offlineReply = generateOfflineFallback(textToSend);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          isGemini: false,
          text: `*(Gemini API Warning: ${err.message})*\n\n` + offlineReply.text,
          actions: offlineReply.actions
        }
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handlePromptClick = (promptText) => {
    setInputQuery(promptText);
    handleSendMessage(promptText);
  };

  return (
    <div className="chat-layout">
      {/* Main Chat Box */}
      <div className="chat-box glass-card">
        {/* Gemini API Key Configuration Banner */}
        <div style={{ background: 'rgba(10,132,255,0.08)', borderBottom: '1px solid var(--bg-card-border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: apiKey ? 'var(--safe-green)' : 'var(--warn-amber)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {apiKey ? '✨ Gemini 1.5 Flash AI Active' : '⚡ Offline Resilient Triage Mode'}
            </span>
          </div>

          <button 
            className="map-chip-btn" 
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <Key size={12} /> {showKeyInput ? 'Hide Key Settings' : 'API Key Settings'}
          </button>
        </div>

        {/* API Key Input Collapsible Form */}
        {showKeyInput && (
          <div style={{ background: 'rgba(15,23,42,0.95)', padding: '12px 16px', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="password" 
                className="form-input" 
                style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
                placeholder="Paste Google Gemini API Key (e.g. AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button 
                className="action-btn-sm" 
                style={{ background: 'var(--safe-green)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleSaveKey}
              >
                <Check size={14} /> Save Key
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              🔑 API keys are stored securely in your browser's local storage. Obtain your key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Google AI Studio</a>.
            </p>
          </div>
        )}

        {apiError && (
          <div style={{ background: 'rgba(255,59,48,0.12)', borderBottom: '1px solid rgba(255,59,48,0.3)', padding: '6px 16px', fontSize: '0.78rem', color: '#ffb4ab', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> {apiError}
          </div>
        )}

        {/* Chat Messages Scroll */}
        <div className="chat-messages-scroll">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.sender === 'ai' ? (msg.isGemini ? 'var(--safe-green)' : 'var(--accent-blue)') : '#ffffff' }}>
                  {msg.sender === 'ai' ? (msg.isGemini ? '✨ AidPulse Gemini 1.5 AI' : '🤖 AidPulse Triage Agent') : '📍 You'}
                </span>
                {msg.sender === 'ai' && (
                  <button 
                    onClick={() => handleSpeakText(msg.text)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    title="Audio Readout"
                  >
                    <Volume2 size={15} />
                  </button>
                )}
              </div>

              <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

              {/* Embedded Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {msg.actions.map((act, idx) => (
                    <div key={idx} className="chat-action-card">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.label}</span>
                      <button 
                        className="action-btn-sm"
                        onClick={() => {
                          if (act.action === 'sos') onOpenSOS();
                          else if (act.tab) onNavigateTab(act.tab);
                          else if (act.phone) window.open(`tel:${act.phone}`);
                        }}
                      >
                        Execute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoadingAI && (
            <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
              <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.85rem' }}>AidPulse Gemini AI is reasoning crisis guidelines...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="quick-prompts-bar">
          <button className="prompt-pill-btn" onClick={() => handlePromptClick("Trapped in rising flood water in Sector 4! What should I do step-by-step?")}>
            🌊 Trapped in Flood Water
          </button>
          <button className="prompt-pill-btn" onClick={() => handlePromptClick("Severe burn injury on arm, need emergency first aid triage.")}>
            🔥 Severe Burn First Aid
          </button>
          <button className="prompt-pill-btn" onClick={() => handlePromptClick("Where is the nearest shelter with free beds and pet access?")}>
            🏠 Pet-Friendly Shelter
          </button>
          <button className="prompt-pill-btn" onClick={() => handlePromptClick("Earthquake aftershock guidelines for high-rise buildings.")}>
            ⚡ High-Rise Earthquake
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="chat-input-area">
          <button 
            className={`icon-action-btn ${isListening ? 'listening' : ''}`}
            onClick={handleToggleVoiceInput}
            title={isListening ? "Listening..." : "Voice Input"}
            style={{ background: isListening ? 'var(--sos-red)' : 'rgba(255,255,255,0.08)' }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input 
            type="text" 
            className="chat-input-field" 
            placeholder={t.askAIPlaceholder}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />

          <button className="icon-action-btn" onClick={() => handleSendMessage()}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar Capability Card */}
      <div className="sidebar-panel">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div className="section-header-sm" style={{ marginBottom: '14px', color: 'var(--safe-green)' }}>
            <Sparkles size={20} />
            <span>Gemini 1.5 Flash Precision</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              By supplying your Gemini API key, AidPulse unlocks Google's high-precision reasoning for disaster medical triage, structural safety checks, and step-by-step crisis survival protocols.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-card-border)' }}>
              <b>Status:</b> {apiKey ? <span style={{ color: 'var(--safe-green)' }}>🟢 Connected (Gemini 1.5)</span> : <span style={{ color: 'var(--warn-amber)' }}>🟠 Offline Rules Active</span>}
            </div>

            <button 
              className="primary-submit-btn" 
              style={{ background: 'linear-gradient(135deg, #0a84ff, #0056b3)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={onOpenSOS}
            >
              <ShieldAlert size={18} /> Request Emergency Rescue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

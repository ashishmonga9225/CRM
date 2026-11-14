'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Check, Sparkles, Copy } from 'lucide-react';
import { Lead } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { addFollowUp } from '@/lib/storage';

interface WhatsAppModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpLogged?: () => void;
}

export default function WhatsAppModal({
  lead,
  isOpen,
  onClose,
  onFollowUpLogged,
}: WhatsAppModalProps) {
  const { user } = useAuth();
  const agentName = user?.name || 'Ashish';

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [autoLogFollowUp, setAutoLogFollowUp] = useState(true);
  const [copied, setCopied] = useState(false);
  const [senderPhone, setSenderPhone] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_user_whatsapp_phone');
      if (stored) setSenderPhone(stored);
    }
  }, []);

  if (!isOpen || !lead) return null;

  const clientName = lead.name || 'Sir/Ma\'am';
  const projectName = lead.project?.name || 'our latest luxury projects';
  const reqText = lead.requirement ? ` regarding ${lead.requirement}` : ' regarding property';

  const TEMPLATES = [
    {
      id: 'default_inquiry',
      title: 'Inquiry: Investment vs Self-Use (Default)',
      emoji: '👋',
      getText: () =>
        `Hi ${clientName}, ${agentName} this side. We have received your query${reqText}. Are you looking for investment or self-use?`,
    },
    {
      id: 'brochure',
      title: 'Share Brochure & Price Details',
      emoji: '📄',
      getText: () =>
        `Hi ${clientName}, ${agentName} here from ${projectName}. Sharing the project brochure, floor plans, and pricing details. Let me know if you would like me to explain the payment plans.`,
    },
    {
      id: 'site_visit',
      title: 'Weekend Site Visit Invitation',
      emoji: '🚗',
      getText: () =>
        `Hello ${clientName}, we are arranging exclusive site visits for ${projectName} this weekend. Would Saturday or Sunday morning work better for a visit with your family?`,
    },
    {
      id: 'followup_call',
      title: 'Missed Call / Follow-up',
      emoji: '📞',
      getText: () =>
        `Hi ${clientName}, tried reaching you over a call just now. Please let me know when you would be free for a quick 2-minute chat regarding your property search.`,
    },
    {
      id: 'special_offer',
      title: 'Special Offer / Limited Inventory',
      emoji: '⭐',
      getText: () =>
        `Hi ${clientName}, following up regarding ${projectName}. We have an exclusive pricing benefit on selected units this week. Let me know if you would like to reserve before prices revise.`,
    },
    {
      id: 'payment_plan',
      title: 'Payment Plan & Calculation Sheet',
      emoji: '💳',
      getText: () =>
        `Hi ${clientName}, we have a flexible payment scheme available for ${projectName} with attractive bank loan tie-ups. Would you like me to share the calculation sheet?`,
    },
    {
      id: 'connect_card',
      title: 'Save Contact / Direct WhatsApp',
      emoji: '🤝',
      getText: () =>
        `Hi ${clientName}, ${agentName} this side${senderPhone ? ` (+91 ${senderPhone})` : ''}. Please save my contact for instant updates, construction progress photos, and new launches.`,
    },
  ];

  // Initialize or update message when template changes
  useEffect(() => {
    setCustomMessage(TEMPLATES[selectedTemplateIndex].getText());
  }, [selectedTemplateIndex, lead, agentName]);

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const handleCopy = async () => {
    const finalMsg = customMessage.trim() || TEMPLATES[selectedTemplateIndex].getText();
    try {
      await navigator.clipboard.writeText(finalMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSend = async () => {
    const finalMsg = customMessage.trim() || TEMPLATES[selectedTemplateIndex].getText();
    const encoded = encodeURIComponent(finalMsg);
    const whatsappUrl = `https://wa.me/${waPhone}?text=${encoded}`;

    if (autoLogFollowUp) {
      try {
        await addFollowUp(lead.id, {
          channel: 'whatsapp',
          outcome: 'WhatsApp message sent',
          note: `Sent WhatsApp: "${finalMsg.slice(0, 80)}..."`,
          next_follow_up_at: new Date(Date.now() + 86400000).toISOString(),
        });
        if (onFollowUpLogged) onFollowUpLogged();
      } catch (err) {
        console.error('Failed to log WhatsApp follow-up:', err);
      }
    }

    // Open WhatsApp in new window / phone app
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 block">
                WhatsApp Messenger
              </span>
              <h3 className="text-base font-extrabold text-slate-900 truncate">
                {lead.name} <span className="text-xs font-mono font-normal text-slate-500">({lead.phone})</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Template Picker Chips */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Choose Message Template
            </label>
            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl, idx) => {
                const isSelected = selectedTemplateIndex === idx;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{tmpl.emoji}</span>
                      <span className="truncate font-bold">{tmpl.title}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Live Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Message Preview (Editable)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-medium">
                  Sender: <strong className="text-slate-800">{agentName}</strong>
                  {senderPhone && <span className="ml-1 text-slate-500">({senderPhone})</span>}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-blue-600" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
            />
          </div>

          {/* Auto-Log Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoLog"
              checked={autoLogFollowUp}
              onChange={e => setAutoLogFollowUp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="autoLog" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Automatically record this as a WhatsApp follow-up in CRM
            </label>
          </div>

          {/* Send on WhatsApp Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSend}
              className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

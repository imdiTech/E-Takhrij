import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '../api'


const isArabicText = (text) => {
    if (!text) return false;
    const arabicChars = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    return totalChars > 0 && (arabicChars.length / totalChars) > 0.3;
};

const markdownComponents = {
    p: ({ children }) => {
        const textContent = Array.isArray(children)
            ? children.map(c => typeof c === 'string' ? c : '').join('')
            : typeof children === 'string' ? children : '';

        if (isArabicText(textContent)) {
            return (
                <p className="arabic-text text-2xl text-right leading-loose my-2 select-all" dir="rtl">
                    {children}
                </p>
            );
        }
        return <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>;
    },
    table: ({ children }) => (
        <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm max-w-full">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs md:text-sm text-left">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-slate-100 dark:bg-slate-900/50">
            {children}
        </thead>
    ),
    tbody: ({ children }) => (
        <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-transparent">
            {children}
        </tbody>
    ),
    tr: ({ children }) => (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            {children}
        </tr>
    ),
    th: ({ children }) => (
        <th className="px-4 py-3 text-slate-800 dark:text-slate-200 font-semibold text-left">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
            {children}
        </td>
    ),
    ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="leading-relaxed">
            {children}
        </li>
    ),
    strong: ({ children }) => (
        <strong className="font-bold text-slate-900 dark:text-white">
            {children}
        </strong>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 my-3 bg-emerald-50/40 dark:bg-emerald-950/20 italic rounded-r-md">
            {children}
        </blockquote>
    ),
    code: ({ children }) => (
        <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono text-xs">
            {children}
        </code>
    )
};

export default function ChatPage() {
    const [query, setQuery] = useState('')
    const [conversation, setConversation] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const handleSend = async () => {
        if (!query.trim()) return

        const userMessage = { role: 'user', content: query }
        setConversation(prev => [...prev, userMessage])
        setQuery('')
        setIsLoading(true)

        try {
            const res = await api.post('/ai/ask', { query: userMessage.content })
            const aiMessage = { role: 'ai', content: res.data.answer }
            setConversation(prev => [...prev, aiMessage])
        } catch (err) {
            console.error(err)
            const errorMessage = { role: 'ai', content: 'Maaf, terjadi kesalahan saat menghubungi asisten AI.' }
            setConversation(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-[70vh] w-full">
            <div className="flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full h-full overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-200">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl shadow-inner">
                        <i className="fa-solid fa-robot"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Santri ILHA Assistant</h2>
                        <p className="text-slate-500 text-sm dark:text-slate-400">Powered by Gemini AI</p>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-4">
                    {conversation.length === 0 ? (
                        <div className="text-center py-10">
                            <i className="fa-solid fa-comments text-4xl text-slate-200 mb-4"></i>
                            <p className="text-slate-500">Ketik pertanyaan Anda tentang hadis di bawah ini.</p>
                            <p className="text-slate-500">atau sebutkan teks hadits yang Anda ketahui, contohnya: <br /> "طلب العلم فريضة على كل مسلم ومسلمة"</p>
                        </div>
                    ) : (
                        conversation.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 text-white'}`}>
                                    <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                                </div>
                                <div className={`p-4 rounded-2xl text-sm max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none dark:bg-slate-900' : 'bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-tl-none dark:bg-emerald-950/30 dark:text-emerald-100 dark:border-emerald-900/50'}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                                <i className="fa-solid fa-robot text-xs"></i>
                            </div>
                            <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl rounded-tl-none text-sm border border-emerald-100 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Tanya ILHA tentang hadis..."
                            className="flex-grow bg-white dark:bg-slate-900 dark:border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 shadow-sm"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !query.trim()}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-black dark:hover:bg-emerald-600 px-5 py-3 rounded-xl disabled:opacity-50 transition-colors shadow-sm">
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

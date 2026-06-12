"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { US_STATES } from "../lib/constants";

type Lang = "en" | "es";

const text = {
  en: {
    welcomeBack: "Welcome back",
    join: "Join Pulse50",
    signInTitle: "SIGN IN",
    createTitle: "CREATE\nACCOUNT",
    login: "Login",
    signup: "Sign Up",
    sendCode: "Send Code",
    verifyCode: "Verify Code",
    sending: "Sending code...",
    verifying: "Verifying...",
    email: "Email",
    code: "6-Digit Code",
    enterCode: "Enter the code from your email",
    yourState: "Your State",
    selectState: "Select your state...",
    civicIdentity: "Your civic identity will be generated from your state.",
    fillEmail: "Please enter your email.",
    fillCode: "Please enter your 6-digit code.",
    selectStateError: "Please select your state.",
    codeSent: "Code sent. Check your email.",
    invalidCode: "Invalid or expired code.",
    profileError: "Account profile could not be verified.",
    banned: "Your account has been restricted.",
    terms:
      "By creating an account you agree to our terms of service. Pulse50 is a public opinion platform and does not represent official government positions.",
  },
  es: {
    welcomeBack: "Bienvenido de nuevo",
    join: "Únete a Pulse50",
    signInTitle: "INICIAR SESIÓN",
    createTitle: "CREAR\nCUENTA",
    login: "Entrar",
    signup: "Registrarse",
    sendCode: "Enviar Código",
    verifyCode: "Verificar Código",
    sending: "Enviando código...",
    verifying: "Verificando...",
    email: "Correo electrónico",
    code: "Código de 6 dígitos",
    enterCode: "Ingresa el código de tu correo",
    yourState: "Tu Estado",
    selectState: "Selecciona tu estado...",
    civicIdentity: "Tu identidad cívica se generará a partir de tu estado.",
    fillEmail: "Por favor ingresa tu correo.",
    fillCode: "Por favor ingresa tu código de 6 dígitos.",
    selectStateError: "Por favor selecciona tu estado.",
    codeSent: "Código enviado. Revisa tu correo.",
    invalidCode: "Código inválido o vencido.",
    profileError: "No se pudo verificar el perfil.",
    banned: "Tu cuenta ha sido restringida.",
    terms:
      "Al crear una cuenta aceptas nuestros términos de servicio. Pulse50 es una plataforma de opinión pública y no representa posiciones oficiales del gobierno.",
  },
};

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const t = text[lang];

  useEffect(() => {
    const saved = localStorage.getItem("pulse50_lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  function changeLang(nextLang: Lang) {
    setLang(nextLang);
    localStorage.setItem("pulse50_lang", nextLang);
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError(t.fillEmail);
      return;
    }

    if (mode === "signup" && !selectedState) {
      setError(t.selectStateError);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          selected_state: selectedState,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setCodeSent(true);
    setSuccess(t.codeSent);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code || code.length < 6) {
      setError(t.fillCode);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.user) {
      setLoading(false);
      setError(t.invalidCode);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("banned")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(t.profileError);
      return;
    }

    if (profile?.banned) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(t.banned);
      return;
    }

    router.push("/representatives");
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-white">Pulse</span>
          <span className="text-yellow-400">50</span>
        </Link>

        <div className="flex border border-white/10 rounded-full overflow-hidden text-xs font-black uppercase">
          <button
            type="button"
            onClick={() => changeLang("en")}
            className={`px-3 py-2 transition ${
              lang === "en"
                ? "bg-yellow-400 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => changeLang("es")}
            className={`px-3 py-2 transition ${
              lang === "es"
                ? "bg-yellow-400 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Español
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
              {mode === "login" ? t.welcomeBack : t.join}
            </p>
            <h1 className="text-5xl font-black text-white leading-none whitespace-pre-line">
              {mode === "login" ? t.signInTitle : t.createTitle}
            </h1>
          </div>

          <div className="flex border border-white/10 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setCodeSent(false);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition ${
                mode === "login"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setCodeSent(false);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition ${
                mode === "signup"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.signup}
            </button>
          </div>

          {success && (
            <div className="mb-6 border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 text-sm font-bold">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={codeSent ? verifyCode : sendCode} className="space-y-4">
            {mode === "signup" && !codeSent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {t.yourState}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-black border border-white/10 px-4 py-4 text-white outline-none focus:border-yellow-400 transition text-sm appearance-none"
                >
                  <option value="" disabled>
                    {t.selectState}
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">{t.civicIdentity}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {t.email}
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={codeSent}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm disabled:opacity-60"
              />
            </div>

            {codeSent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {t.code}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={t.enterCode}
                  className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 text-sm uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? codeSent
                  ? t.verifying
                  : t.sending
                : codeSent
                ? t.verifyCode
                : t.sendCode}
            </button>
          </form>

          <p className="text-center text-xs text-gray-700 mt-8 leading-relaxed">
            {t.terms}
          </p>
        </div>
      </div>
    </main>
  );
}
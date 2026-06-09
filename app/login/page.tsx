"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { generateCivicIdentity } from "../lib/civicIdentity";
import { US_STATES } from "../lib/constants";

const attempts: number[] = [];

type Lang = "en" | "es";

const text = {
  en: {
    welcomeBack: "Welcome back",
    join: "Join Pulse50",
    signInTitle: "SIGN IN",
    createTitle: "CREATE\nACCOUNT",
    login: "Login",
    signup: "Sign Up",
    tooMany: "Too many attempts. Please wait a minute and try again.",
    fillAll: "Please fill in all fields.",
    passwordLength: "Password must be at least 8 characters.",
    selectStateError: "Please select your state.",
    accountCreated: "Account created! Check your email to confirm, then log in.",
    invalidLogin: "Invalid email or password.",
    profileError: "Account profile could not be verified.",
    banned: "Your account has been restricted.",
    yourState: "Your State",
    selectState: "Select your state...",
    civicIdentity: "Your civic identity will be generated from your state.",
    email: "Email",
    password: "Password",
    minPassword: "Min. 8 characters",
    signingIn: "Signing in...",
    creating: "Creating account...",
    signIn: "Sign In",
    createAccount: "Create Account",
    forgot: "Forgot your password?",
    reset: "Reset it",
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
    tooMany: "Demasiados intentos. Espera un minuto e inténtalo otra vez.",
    fillAll: "Por favor completa todos los campos.",
    passwordLength: "La contraseña debe tener al menos 8 caracteres.",
    selectStateError: "Por favor selecciona tu estado.",
    accountCreated: "¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.",
    invalidLogin: "Correo o contraseña inválidos.",
    profileError: "No se pudo verificar el perfil de la cuenta.",
    banned: "Tu cuenta ha sido restringida.",
    yourState: "Tu Estado",
    selectState: "Selecciona tu estado...",
    civicIdentity: "Tu identidad cívica se generará a partir de tu estado.",
    email: "Correo electrónico",
    password: "Contraseña",
    minPassword: "Mínimo 8 caracteres",
    signingIn: "Iniciando sesión...",
    creating: "Creando cuenta...",
    signIn: "Iniciar sesión",
    createAccount: "Crear cuenta",
    forgot: "¿Olvidaste tu contraseña?",
    reset: "Restablécela",
    terms:
      "Al crear una cuenta aceptas nuestros términos de servicio. Pulse50 es una plataforma de opinión pública y no representa posiciones oficiales del gobierno.",
  },
};

function isRateLimited(): boolean {
  const now = Date.now();
  const recent = attempts.filter((t) => now - t < 60_000);
  attempts.length = 0;
  attempts.push(...recent);
  return recent.length >= 5;
}

function recordAttempt() {
  attempts.push(Date.now());
}

export default function LoginPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const t = text[lang];

  useEffect(() => {
    const saved = localStorage.getItem("pulse50_lang");
    if (saved === "en" || saved === "es") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  function changeLang(nextLang: Lang) {
    setLang(nextLang);
    localStorage.setItem("pulse50_lang", nextLang);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (honeypot) return;

    if (isRateLimited()) {
      setError(t.tooMany);
      return;
    }

    recordAttempt();

    if (!email || !password) {
      setError(t.fillAll);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      if (!selectedState) {
        setError(t.selectStateError);
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { civicName, state, stateAbbr } =
          generateCivicIdentity(selectedState);

        await supabase.from("profiles").insert({
          id: data.user.id,
          civic_name: civicName,
          state,
          state_abbr: stateAbbr,
          is_admin: false,
          banned: false,
        });
      }

      setSuccess(t.accountCreated);
      setMode("login");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(t.invalidLogin);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("banned")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      setError(t.profileError);
      setLoading(false);
      return;
    }

    if (profile?.banned) {
      await supabase.auth.signOut();
      setError(t.banned);
      setLoading(false);
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
              onClick={() => {
                setMode("login");
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
              onClick={() => {
                setMode("signup");
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                height: 0,
              }}
            />

            {mode === "signup" && (
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
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? t.minPassword : "••••••••"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className="w-full bg-black border border-white/10 px-4 py-4 pr-12 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 text-sm uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? mode === "login"
                  ? t.signingIn
                  : t.creating
                : mode === "login"
                ? t.signIn
                : t.createAccount}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-600 mt-6">
              {t.forgot}{" "}
              <Link
                href="/reset-password"
                className="text-yellow-400 hover:underline font-bold"
              >
                {t.reset}
              </Link>
            </p>
          )}

          <p className="text-center text-xs text-gray-700 mt-8 leading-relaxed">
            {t.terms}
          </p>
        </div>
      </div>
    </main>
  );
}
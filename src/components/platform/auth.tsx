"use client";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";

export function PlatformAuth() {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="platform-card">
      <h2>
        {mode === "login"
          ? "Ingresa a tu liga"
          : mode === "register"
            ? "Crea tu cuenta"
            : "Recupera tu contraseña"}
      </h2>
      <p>
        Usa el correo al que el administrador dio acceso. Crear una cuenta no
        otorga permisos para una liga.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setMessage("");
          const email = String(data.get("email")),
            password = String(data.get("password"));
          try {
            if (mode === "reset") {
              await sendPasswordResetEmail(firebaseAuth, email);
              setMessage(
                "Si el correo corresponde a una cuenta, recibirás instrucciones para recuperar el acceso.",
              );
            } else if (mode === "register") {
              const result = await createUserWithEmailAndPassword(
                firebaseAuth,
                email,
                password,
              );
              await sendEmailVerification(result.user);
              setMessage(
                "Revisa tu correo para verificar la cuenta y vuelve a ingresar.",
              );
            } else
              await signInWithEmailAndPassword(firebaseAuth, email, password);
          } catch {
            setMessage(
              "No pudimos completar la solicitud. Revisa los datos o inténtalo más tarde.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Correo
          <input type="email" name="email" autoComplete="email" required />
        </label>
        {mode !== "reset" && (
          <label>
            Contraseña
            <input
              type="password"
              name="password"
              minLength={mode === "register" ? 12 : 1}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
            />
          </label>
        )}
        <button disabled={busy}>
          {busy
            ? "Procesando…"
            : mode === "reset"
              ? "Enviar instrucciones"
              : "Continuar"}
        </button>
      </form>
      <div className="platform-actions">
        <button className="subtle" onClick={() => setMode("login")}>
          Ingresar
        </button>
        <button className="subtle" onClick={() => setMode("register")}>
          Crear cuenta
        </button>
        <button className="subtle" onClick={() => setMode("reset")}>
          Olvidé mi contraseña
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

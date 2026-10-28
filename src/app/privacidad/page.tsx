import Link from "next/link";
import "@/components/platform/platform.css";
export const metadata = { title: "Privacidad y solicitudes" };
export default function Page() {
  return (
    <main className="platform">
      <Link href="/">Volver a Lifiweb</Link>
      <h1>Privacidad y uso de información deportiva</h1>
      <p>
        Lifiweb muestra calendarios, resultados, equipos y la información
        deportiva que administra cada liga. La administración requiere una
        cuenta y permisos otorgados por la organización.
      </p>
      <h2>Publicación de nombres e imágenes</h2>
      <p>
        La liga debe verificar las autorizaciones necesarias antes de publicar
        nombres o fotografías, especialmente de menores. En los nuevos torneos,
        los jugadores se registran como privados salvo confirmación expresa del
        encargado. No ingreses documentos de identidad, direcciones, contactos
        personales ni información médica en los campos deportivos.
      </p>
      <h2>Correcciones y retiro</h2>
      <p>
        Contacta al organizador de tu liga indicando el torneo y el registro que
        deseas corregir o retirar. En las páginas de las nuevas ligas
        encontrarás su correo de contacto al pie. Para LIFI, utiliza el canal
        habitual con la organización. No envíes documentos sensibles en una
        solicitud inicial.
      </p>
      <h2>Estadísticas de visitas</h2>
      <p>
        El sitio integra Vercel Web Analytics para medir el uso de páginas
        públicas cuando el servicio está habilitado. La integración excluye las
        áreas de administración y elimina los parámetros de las direcciones
        antes del envío. No se envían nombres de jugadores ni correos como
        eventos personalizados.
      </p>
      <h2>Acceso, conservación y respaldos</h2>
      <p>
        Los administradores de cada liga controlan los accesos y la publicación.
        Retirar un registro de la vista pública no equivale a borrarlo del
        historial o de los respaldos. Las solicitudes de eliminación definitiva
        deben coordinarse con la organización, incluyendo su historial y copias
        de seguridad.
      </p>
      <p>
        Esta página describe el funcionamiento de la plataforma. Cada liga debe
        comunicar sus responsables, autorizaciones y plazos de conservación
        antes de publicar información personal.
      </p>
    </main>
  );
}

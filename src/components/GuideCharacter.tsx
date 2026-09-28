/** Replaceable guide slot. No invented mascot is rendered without an asset. */
export function GuideCharacter({ message, image }: { message: string; image?: { src: string; alt: string } }) {
  return <div className="guide-character" role="status" aria-live="polite" aria-atomic="true">
    {image && <img src={image.src} alt={image.alt} width="44" height="44" />}<p>{message}</p>
  </div>
}

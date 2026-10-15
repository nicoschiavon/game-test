// Cálculo de cuerpos circulares para sprites escalados — puro, sin Phaser.
// Phaser Arcade define setCircle en píxeles *fuente* y multiplica por la
// escala del sprite (Body.setCircle/setSize). Para conservar las hitboxes de
// la Etapa 1 con sprites 16px a escala ×3, el radio fuente se divide.

export interface CircleHitbox {
  /** Radio en píxeles fuente para setCircle. */
  radius: number;
  /** Offset en píxeles fuente para centrar el cuerpo en el frame. */
  offset: number;
}

/** Calcula radio fuente + offset centrado para un cuerpo de `displayRadius`. */
export function scaledCircle(displayRadius: number, scale: number, frameSize: number): CircleHitbox {
  const radius = displayRadius / scale;
  return { radius, offset: (frameSize - radius * 2) / 2 };
}

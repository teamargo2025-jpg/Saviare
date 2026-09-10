import { describe, expect, it } from 'vitest';
import { MAX_LADO, calcularDimensiones, nombreComprimido, pesoLegible } from './comprimir-imagen.js';

describe('calcularDimensiones', () => {
  it('no agranda una imagen que ya es chica', () => {
    expect(calcularDimensiones(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it('deja intacta la que mide justo el máximo', () => {
    expect(calcularDimensiones(MAX_LADO, 900)).toEqual({ ancho: MAX_LADO, alto: 900 });
  });

  it('achica por el lado mayor y conserva la proporción', () => {
    // Foto típica de celular en horizontal (4032x3024, 4:3).
    const r = calcularDimensiones(4032, 3024);
    expect(r.ancho).toBe(1600);
    expect(r.alto).toBe(1200);
    expect(r.ancho / r.alto).toBeCloseTo(4032 / 3024, 2);
  });

  it('funciona igual con fotos verticales', () => {
    const r = calcularDimensiones(3024, 4032);
    expect(r.alto).toBe(1600);
    expect(r.ancho).toBe(1200);
  });

  it('nunca deja un lado en cero', () => {
    // Una panorámica extrema redondearía el alto a 0 y el canvas
    // fallaría al dibujarla.
    const r = calcularDimensiones(8000, 2);
    expect(r.alto).toBeGreaterThanOrEqual(1);
  });

  it('respeta un máximo distinto', () => {
    expect(calcularDimensiones(2000, 1000, 500)).toEqual({ ancho: 500, alto: 250 });
  });
});

describe('nombreComprimido', () => {
  it('cambia la extensión', () => {
    expect(nombreComprimido('jabon.jpg')).toBe('jabon.webp');
  });

  it('respeta los puntos que son parte del nombre', () => {
    expect(nombreComprimido('jabon.v2.final.JPEG')).toBe('jabon.v2.final.webp');
  });

  it('soporta un archivo sin extensión', () => {
    expect(nombreComprimido('foto')).toBe('foto.webp');
  });

  it('no deja el nombre vacío', () => {
    expect(nombreComprimido('.jpg')).toBe('imagen.webp');
  });
});

describe('pesoLegible', () => {
  it('muestra bytes, KB y MB según corresponda', () => {
    expect(pesoLegible(500)).toBe('500 B');
    expect(pesoLegible(2048)).toBe('2 KB');
    expect(pesoLegible(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

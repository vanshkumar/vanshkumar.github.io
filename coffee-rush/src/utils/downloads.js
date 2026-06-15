const PNG_MIME_TYPE = 'image/png';
const TRANSPARENT_COLORS = new Set(['transparent', 'rgba(0, 0, 0, 0)', 'rgb(0 0 0 / 0)']);

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadTextFile(text, filename, type = 'text/plain') {
  downloadBlob(new Blob([text], { type }), filename);
}

export async function downloadElementScreenshot(element, filename) {
  const blob = await createElementScreenshotBlob(element);
  downloadBlob(blob, filename);
}

async function createElementScreenshotBlob(element) {
  if (!element) {
    throw new Error('Screenshot target was not found.');
  }

  const { width, height } = getElementSize(element);
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas rendering is not available.');
  }

  context.scale(scale, scale);
  context.fillStyle = getCanvasColor(getPageBackground(element), '#ffffff');
  context.fillRect(0, 0, width, height);
  renderElement(context, element, element.getBoundingClientRect());
  return await canvasToBlob(canvas);
}

function getElementSize(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.ceil(Math.max(rect.width, element.scrollWidth, element.offsetWidth, 1)),
    height: Math.ceil(Math.max(rect.height, element.scrollHeight, element.offsetHeight, 1)),
  };
}

function renderElement(context, element, rootRect) {
  const style = getComputedStyle(element);

  if (style.display === 'none' || style.visibility === 'hidden') {
    return;
  }

  const opacity = Number.parseFloat(style.opacity);

  if (opacity <= 0) {
    return;
  }

  context.save();
  context.globalAlpha *= Number.isFinite(opacity) ? opacity : 1;
  drawElementBox(context, element, style, rootRect);
  drawFormControlValue(context, element, style, rootRect);

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      drawTextNode(context, child, rootRect);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      renderElement(context, child, rootRect);
    }
  }

  context.restore();
}

function drawElementBox(context, element, style, rootRect) {
  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const x = rect.left - rootRect.left;
  const y = rect.top - rootRect.top;
  const borderRadius = parseCssLength(style.borderTopLeftRadius, Math.min(rect.width, rect.height));
  const backgroundColor = getElementBackground(style);

  if (!isTransparentColor(backgroundColor)) {
    context.fillStyle = getCanvasColor(backgroundColor, '#ffffff');
    fillRoundedRect(context, x, y, rect.width, rect.height, borderRadius);
  }

  drawBorders(context, style, x, y, rect.width, rect.height);
  drawOutline(context, style, x, y, rect.width, rect.height);
}

function drawFormControlValue(context, element, style, rootRect) {
  const value = getFormControlValue(element);

  if (!value) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const fontSize = parseCssLength(style.fontSize, 16);
  const paddingLeft = parseCssLength(style.paddingLeft);
  const paddingRight = parseCssLength(style.paddingRight);
  const borderLeft = parseCssLength(style.borderLeftWidth);
  const borderRight = parseCssLength(style.borderRightWidth);
  const x = rect.left - rootRect.left + paddingLeft + borderLeft;
  const y = rect.top - rootRect.top + Math.max((rect.height - fontSize) / 2, 0);
  const maxWidth = Math.max(rect.width - paddingLeft - paddingRight - borderLeft - borderRight, 1);
  const fontFamily = style.fontFamily || 'sans-serif';
  const fontStyle = style.fontStyle === 'normal' ? '' : `${style.fontStyle} `;
  const fontWeight = style.fontWeight === 'normal' ? '' : `${style.fontWeight} `;

  context.fillStyle = getCanvasColor(style.color, '#2b211b');
  context.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
  context.textBaseline = 'top';
  context.fillText(value, x, y, maxWidth);
}

function getFormControlValue(element) {
  if (element instanceof HTMLInputElement) {
    return ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(
      element.type,
    )
      ? ''
      : element.value;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  if (element instanceof HTMLSelectElement) {
    return element.selectedOptions[0]?.textContent?.trim() ?? '';
  }

  return '';
}

function drawTextNode(context, textNode, rootRect) {
  const text = textNode.textContent.replace(/\s+/g, ' ').trim();
  const parentElement = textNode.parentElement;

  if (!text || !parentElement) {
    return;
  }

  const style = getComputedStyle(parentElement);

  if (style.display === 'none' || style.visibility === 'hidden' || isTransparentColor(style.color)) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(textNode);
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0,
  );
  range.detach();

  if (rects.length === 0) {
    return;
  }

  const firstRect = rects[0];
  const fontSize = parseCssLength(style.fontSize, 16);
  const lineHeight = parseLineHeight(style.lineHeight, fontSize);
  const fontFamily = style.fontFamily || 'sans-serif';
  const fontStyle = style.fontStyle === 'normal' ? '' : `${style.fontStyle} `;
  const fontWeight = style.fontWeight === 'normal' ? '' : `${style.fontWeight} `;
  const maxWidth = Math.max(...rects.map((rect) => rect.width));

  context.fillStyle = getCanvasColor(style.color, '#2b211b');
  context.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
  context.textBaseline = 'top';
  drawWrappedText(
    context,
    text,
    firstRect.left - rootRect.left,
    firstRect.top - rootRect.top,
    maxWidth,
    lineHeight,
  );
}

function drawBorders(context, style, x, y, width, height) {
  const borders = [
    {
      color: style.borderTopColor,
      size: parseCssLength(style.borderTopWidth),
      x,
      y,
      width,
      height: parseCssLength(style.borderTopWidth),
    },
    {
      color: style.borderRightColor,
      size: parseCssLength(style.borderRightWidth),
      x: x + width - parseCssLength(style.borderRightWidth),
      y,
      width: parseCssLength(style.borderRightWidth),
      height,
    },
    {
      color: style.borderBottomColor,
      size: parseCssLength(style.borderBottomWidth),
      x,
      y: y + height - parseCssLength(style.borderBottomWidth),
      width,
      height: parseCssLength(style.borderBottomWidth),
    },
    {
      color: style.borderLeftColor,
      size: parseCssLength(style.borderLeftWidth),
      x,
      y,
      width: parseCssLength(style.borderLeftWidth),
      height,
    },
  ];

  for (const border of borders) {
    if (border.size <= 0 || isTransparentColor(border.color)) {
      continue;
    }

    context.fillStyle = getCanvasColor(border.color, '#000000');
    context.fillRect(border.x, border.y, border.width, border.height);
  }
}

function drawOutline(context, style, x, y, width, height) {
  const outlineWidth = parseCssLength(style.outlineWidth);

  if (outlineWidth <= 0 || style.outlineStyle === 'none' || isTransparentColor(style.outlineColor)) {
    return;
  }

  context.strokeStyle = getCanvasColor(style.outlineColor, '#000000');
  context.lineWidth = outlineWidth;
  context.strokeRect(
    x - outlineWidth / 2,
    y - outlineWidth / 2,
    width + outlineWidth,
    height + outlineWidth,
  );
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = candidate;
    }
  }

  if (line) {
    context.fillText(line, x, lineY);
  }
}

function fillRoundedRect(context, x, y, width, height, radius) {
  if (radius <= 0) {
    context.fillRect(x, y, width, height);
    return;
  }

  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
}

function getPageBackground(element) {
  const elementBackground = getComputedStyle(element).backgroundColor;
  const bodyBackground = getComputedStyle(document.body).backgroundColor;
  const rootBackground = getComputedStyle(document.documentElement).backgroundColor;

  if (!isTransparentColor(elementBackground)) return elementBackground;
  if (!isTransparentColor(bodyBackground)) return bodyBackground;
  if (!isTransparentColor(rootBackground)) return rootBackground;
  return '#ffffff';
}

function getElementBackground(style) {
  if (!isTransparentColor(style.backgroundColor)) {
    return style.backgroundColor;
  }

  return 'transparent';
}

function isTransparentColor(color) {
  if (!color) return true;

  const normalized = color.trim().toLowerCase();
  return TRANSPARENT_COLORS.has(normalized) || normalized.endsWith('/ 0)');
}

function getCanvasColor(color, fallback) {
  const canvas = getCanvasColor.canvas ?? document.createElement('canvas');
  getCanvasColor.canvas = canvas;
  const context = canvas.getContext('2d');

  if (!context) return fallback;

  context.fillStyle = fallback;
  context.fillStyle = color;
  return context.fillStyle;
}

function parseCssLength(value, percentageBasis = 0) {
  if (!value || value === 'medium') return 0;

  if (value.endsWith('%')) {
    return (Number.parseFloat(value) / 100) * percentageBasis;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLineHeight(value, fontSize) {
  if (!value || value === 'normal') return fontSize * 1.2;

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return fontSize * 1.2;
  }

  return value.endsWith('px') ? parsed : parsed * fontSize;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Screenshot image was empty.'));
      }
    }, PNG_MIME_TYPE);
  });
}

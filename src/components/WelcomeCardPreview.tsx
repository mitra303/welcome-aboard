'use client';

import { useEffect, useRef, useState } from 'react';
import { getWelcomeCardHtml, WelcomeCardData } from '@/lib/template';

const DESIGN_WIDTH = 940;

function PreviewIframe({
  data,
  imageSrc,
  onHeightChange,
}: {
  data: WelcomeCardData;
  imageSrc: string;
  onHeightChange?: (h: number) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(480);

  useEffect(() => {
    const html = getWelcomeCardHtml(data, imageSrc || '/avatar-placeholder.svg', '');
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;">${html}</body></html>`);
      doc.close();

      const resize = () => {
        const body = doc.body;
        if (body) {
          const h = body.scrollHeight + 16;
          setContentHeight(h);
          onHeightChange?.(h);
        }
      };

      resize();
      const images = doc.querySelectorAll('img');
      images.forEach((img) => img.addEventListener('load', resize));
      const timer = setTimeout(resize, 200);

      return () => {
        images.forEach((img) => img.removeEventListener('load', resize));
        clearTimeout(timer);
      };
    }
  }, [data, imageSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  return { iframeRef, contentHeight };
}

function ScaledPreview({
  data,
  imageSrc,
}: {
  data: WelcomeCardData;
  imageSrc: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(480);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const html = getWelcomeCardHtml(data, imageSrc || '/avatar-placeholder.svg', '');
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;">${html}</body></html>`);
      doc.close();

      const resize = () => {
        const body = doc.body;
        if (body) setContentHeight(body.scrollHeight + 16);
      };

      resize();
      const images = doc.querySelectorAll('img');
      images.forEach((img) => img.addEventListener('load', resize));
      const timer = setTimeout(resize, 200);

      return () => {
        images.forEach((img) => img.removeEventListener('load', resize));
        clearTimeout(timer);
      };
    }
  }, [data, imageSrc]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const updateScale = () => setScale(wrapper.clientWidth / DESIGN_WIDTH);
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full"
      style={{ height: contentHeight * scale, transition: 'height 0.15s ease' }}
    >
      <iframe
        ref={iframeRef}
        title="Welcome Aboard Preview"
        style={{
          width: DESIGN_WIDTH,
          height: contentHeight,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}

function ModalPreview({
  data,
  imageSrc,
}: {
  data: WelcomeCardData;
  imageSrc: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(600);

  useEffect(() => {
    const html = getWelcomeCardHtml(data, imageSrc || '/avatar-placeholder.svg', '');
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;">${html}</body></html>`);
      doc.close();

      const resize = () => {
        const body = doc.body;
        if (body) setContentHeight(body.scrollHeight + 16);
      };

      resize();
      const images = doc.querySelectorAll('img');
      images.forEach((img) => img.addEventListener('load', resize));
      const timer = setTimeout(resize, 300);

      return () => {
        images.forEach((img) => img.removeEventListener('load', resize));
        clearTimeout(timer);
      };
    }
  }, [data, imageSrc]);

  return (
    <iframe
      ref={iframeRef}
      title="Welcome Aboard Preview Full"
      style={{ width: DESIGN_WIDTH, height: contentHeight, border: 'none' }}
    />
  );
}

export default function WelcomeCardPreview({
  data,
  imageSrc,
}: {
  data: WelcomeCardData;
  imageSrc: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="w-full border border-gray-200 rounded-md overflow-hidden relative group">
        <ScaledPreview data={data} imageSrc={imageSrc} />
        {/* Transparent overlay captures clicks that iframe would otherwise swallow */}
        <div
          className="absolute inset-0 cursor-zoom-in bg-transparent group-hover:bg-black/5 transition-colors flex items-start justify-end p-2"
          onClick={() => setShowModal(true)}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-600 text-xs px-2 py-1 rounded shadow select-none">
            🔍 Click to zoom
          </span>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl overflow-auto max-h-[90vh] max-w-[960px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Email Preview</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto">
              <ModalPreview data={data} imageSrc={imageSrc} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

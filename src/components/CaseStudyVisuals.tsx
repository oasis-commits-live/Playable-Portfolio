import React, { useState } from 'react';
import {
  CaseStudyBlock,
  getReferenceCaseStudy,
  ReferenceCaseStudy,
} from '../data/referenceCaseStudies';

export interface CaseStudySlide {
  id: string;
  badge: string;
  title: string;
  caption: string;
  metricsTag: string;
  svgDataUri: string;
}

/**
 * Returns the authentic project images and metadata from https://ayush-dubey-product-designer.ai.studio/
 */
export function getCaseStudySlides(projectId: string, _accentColor?: string): CaseStudySlide[] {
  const cs = getReferenceCaseStudy(projectId);
  const allImages = [cs.heroImage, ...cs.galleryImages];
  const metricSummary = cs.impactMetrics.map((m) => `${m.value} ${m.label}`).join(' · ');

  return allImages.map((imgUrl, idx) => ({
    id: `${cs.id}-screen-${idx + 1}`,
    badge: idx === 0 ? '01 · HERO CASE STUDY SCREEN' : `${String(idx + 1).padStart(2, '0')} · CASE STUDY ARTIFACT`,
    title: idx === 0 ? cs.title : `${cs.client} — ${cs.externalLabel} (Screen ${idx + 1})`,
    caption: cs.description,
    metricsTag: metricSummary,
    svgDataUri: imgUrl,
  }));
}

interface CaseStudyVisualsProps {
  projectId: string;
  accentColor: string;
  activeSection?: 'overview' | 'workflow' | 'research' | 'all' | string;
  onJumpToSection?: (sectionId: string) => void;
}

export const CaseStudyVisuals: React.FC<CaseStudyVisualsProps> = ({
  projectId,
  accentColor,
  activeSection = 'overview',
}) => {
  const cs: ReferenceCaseStudy = getReferenceCaseStudy(projectId);
  const previewImages = [
    cs.heroImage,
    ...cs.galleryImages.filter((url) => !url.endsWith('.svg')),
  ];
  const [selectedHeroIdx, setSelectedHeroIdx] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const safeIdx = selectedHeroIdx < previewImages.length ? selectedHeroIdx : 0;
  const currentHeroSrc = previewImages[safeIdx] || cs.heroImage;
  const projectHref = cs.prototypeUrl || cs.externalUrl || '';

  const renderBlock = (block: CaseStudyBlock, idx: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p
            key={idx}
            className="font-sans text-xs sm:text-sm text-[#cbd5e1] leading-[1.78] mb-4"
          >
            {block.text}
          </p>
        );

      case 'heading':
        if (block.level === 'h4') {
          return (
            <h4
              key={idx}
              className="font-display text-base sm:text-lg font-bold text-[#f8f5ee] tracking-wide mt-6 mb-2.5 border-l-2 border-[#d4af37] pl-3"
            >
              {block.text}
            </h4>
          );
        }
        if (block.level === 'h5') {
          return (
            <h5
              key={idx}
              className="font-hud text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#d4af37] mt-6 mb-2"
            >
              {block.text}
            </h5>
          );
        }
        return (
          <h6
            key={idx}
            className="font-mono text-xs font-semibold uppercase tracking-wider text-[#2dd4bf] mt-4 mb-2"
          >
            {block.text}
          </h6>
        );

      case 'callout':
        return (
          <div
            key={idx}
            className="my-5 p-4 sm:p-5 bg-[#0b1322] border border-[#d4af37]/35 shadow-inner"
          >
            {block.title && (
              <div className="font-hud text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-2.5">
                ✦ {block.title}
              </div>
            )}
            <ul className="space-y-2">
              {block.items.map((item, i) => (
                <li
                  key={i}
                  className="font-sans text-xs sm:text-sm text-[#f8f5ee] font-medium flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-[#2dd4bf] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'list': {
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag key={idx} className="space-y-4 my-4">
            {block.items.map((item, itemIdx) => (
              <li
                key={itemIdx}
                className="font-sans text-xs sm:text-sm text-[#cbd5e1] leading-relaxed"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 font-mono text-xs font-bold text-[#d4af37] pt-0.5 select-none tabular-nums">
                    {block.ordered ? `${String(itemIdx + 1).padStart(2, '0')}.` : '◆'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e2e8f0] leading-[1.7]">{item.text}</p>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="mt-2 space-y-1.5 pl-3.5 border-l border-[#d4af37]/25">
                        {item.subItems.map((sub, subIdx) => (
                          <li
                            key={subIdx}
                            className="text-xs text-[#94a3b8] leading-relaxed flex items-start gap-2"
                          >
                            <span className="text-[#2dd4bf] font-mono select-none">-</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.images && item.images.length > 0 && (
                      <div className="mt-3.5 space-y-3.5">
                        {item.images.map((img, imgIdx) => (
                          <figure
                            key={imgIdx}
                            style={img.maxWidth ? { maxWidth: img.maxWidth } : undefined}
                            onClick={() =>
                              setLightboxImage({
                                src: img.src,
                                alt: img.caption || item.text,
                              })
                            }
                            className="group/img relative overflow-hidden border border-[#d4af37]/30 bg-[#050811] cursor-zoom-in hover:border-[#d4af37] transition-colors"
                          >
                            <img
                              src={img.src}
                              alt={img.caption || `${cs.title} detail`}
                              className="w-full h-auto block"
                              loading="eager"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#05070b]/85 border border-[#d4af37]/40 font-mono text-[10px] text-[#fde68a] opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                              Inspect ↗
                            </div>
                            {img.caption && (
                              <figcaption className="px-3 py-1.5 text-[11px] font-mono text-[#94a3b8] border-t border-[#d4af37]/20 bg-[#070b14]">
                                {img.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ListTag>
        );
      }

      case 'image': {
        const isCompactLogo = block.maxWidth && parseInt(block.maxWidth, 10) <= 300;
        return (
          <figure
            key={idx}
            style={block.maxWidth ? { maxWidth: block.maxWidth } : undefined}
            onClick={() =>
              setLightboxImage({
                src: block.src,
                alt: block.alt || cs.title,
              })
            }
            className={`my-5 ${
              isCompactLogo
                ? 'inline-block overflow-hidden bg-[#0b1220] p-3 border border-[#d4af37]/25 cursor-zoom-in'
                : 'group/img relative w-full overflow-hidden border border-[#d4af37]/30 bg-[#050811] shadow-xl cursor-zoom-in hover:border-[#d4af37] transition-colors'
            }`}
          >
            <img
              src={block.src}
              alt={block.alt || cs.title}
              className="w-full h-auto block"
              loading="eager"
              referrerPolicy="no-referrer"
            />
            {!isCompactLogo && (
              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[#05070b]/85 border border-[#d4af37]/40 font-mono text-[10px] text-[#fde68a] opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                Click to Expand
              </div>
            )}
            {block.caption && (
              <figcaption className="px-3.5 py-2 text-[11px] font-mono text-[#94a3b8] border-t border-[#d4af37]/20 bg-[#070b14]">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      case 'image-grid': {
        const gridCols =
          block.columns === 3
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2';
        return (
          <div key={idx} className={`grid ${gridCols} gap-3.5 my-5`}>
            {block.images.map((img, imgIdx) => (
              <figure
                key={imgIdx}
                onClick={() =>
                  setLightboxImage({
                    src: img.src,
                    alt: img.alt || `${cs.title} visual ${imgIdx + 1}`,
                  })
                }
                className="group/img relative overflow-hidden border border-[#d4af37]/30 bg-[#050811] flex flex-col justify-between cursor-zoom-in hover:border-[#d4af37] transition-colors"
              >
                <div className="w-full h-full flex items-center justify-center bg-[#04070e] p-1">
                  <img
                    src={img.src}
                    alt={img.alt || `${cs.title} visual ${imgIdx + 1}`}
                    className="w-full h-auto object-contain"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#05070b]/85 border border-[#d4af37]/40 font-mono text-[10px] text-[#fde68a] opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                  Zoom
                </div>
                {(img.caption || img.alt) && (
                  <figcaption className="px-3 py-1.5 text-[10px] font-mono text-[#94a3b8] border-t border-[#d4af37]/20 bg-[#070b14] truncate">
                    {img.caption || img.alt}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Filter sections if the user clicked a specific tab, or show all sections in sequence
  const visibleSections =
    activeSection === 'workflow'
      ? cs.sections.filter((s) => s.id === 'approach-process' || s.id === 'process')
      : activeSection === 'research'
      ? cs.sections.filter((s) => s.id === 'core-problem' || s.id === 'results-impact')
      : cs.sections;

  return (
    <div className="space-y-6" data-testid="case-study-visual-showcase">
      {/* Top Metadata & External Project Link Bar (Transferred from Reference Portfolio) */}
      <div className="p-4 bg-[#09101d] border border-[#d4af37]/35">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 font-mono text-xs">
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase">Year</span>
            <span className="text-[#f8f5ee] font-semibold tabular-nums">{cs.year}</span>
          </div>
          <span className="text-[#d4af37]/30 hidden sm:inline">|</span>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase">Category</span>
            <span className="text-[#f8f5ee] font-semibold">
              {cs.projectType} · {cs.category}
            </span>
          </div>
          <span className="text-[#d4af37]/30 hidden sm:inline">|</span>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase">Client / Org</span>
            <span className="text-[#f8f5ee] font-semibold">{cs.client}</span>
          </div>
          <span className="text-[#d4af37]/30 hidden sm:inline">|</span>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase">Role</span>
            <span className="text-[#2dd4bf] font-semibold">{cs.role}</span>
          </div>
          {projectHref && (
            <>
              <span className="text-[#d4af37]/30 hidden sm:inline">|</span>
              <div>
                <span className="text-[#64748b] block text-[10px] uppercase">Project Link</span>
                <a
                  href={projectHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="case-study-project-link"
                  className="text-[#d4af37] hover:text-[#fde68a] underline underline-offset-4 font-semibold inline-flex items-center gap-1"
                >
                  <span>{cs.externalLabel}</span>
                  <span>↗</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3 Key Outcomes / Impact Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cs.impactMetrics.map((m) => (
          <div
            key={m.label}
            className="p-3.5 bg-[#0b1220] border border-[#d4af37]/25 flex flex-col justify-between"
          >
            <div className="font-hud text-xl sm:text-2xl font-bold text-[#d4af37] tabular-nums">
              {m.value}
            </div>
            <div className="font-mono text-[11px] text-[#cbd5e1] mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Hero Case Study Visual Frame + Interactive Multi-Screen Thumbnail Strip */}
      <div className="border border-[#d4af37]/40 bg-[#050811] overflow-hidden shadow-2xl">
        <div
          onClick={() =>
            setLightboxImage({
              src: currentHeroSrc,
              alt: cs.title,
            })
          }
          className="group relative w-full aspect-[16/10] bg-[#04070e] overflow-hidden cursor-zoom-in border-b border-[#d4af37]/25"
        >
          <img
            data-testid="case-study-active-image"
            src={currentHeroSrc}
            alt={cs.title}
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 px-3 py-1 bg-[#05070b]/85 border border-[#d4af37]/45 font-mono text-[10px] text-[#fde68a] flex items-center gap-1.5 pointer-events-none">
            <span>🔍 Click to inspect full resolution</span>
          </div>
        </div>

        {/* Interactive Screen Switcher Strip (Exact pattern from reference portfolio) */}
        <div className="p-3 bg-[#080d18] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {previewImages.slice(0, 8).map((imgUrl, idx) => {
              const isSelected = idx === safeIdx;
              return (
                <button
                  key={imgUrl + idx}
                  type="button"
                  data-testid={`case-study-slide-btn-${idx}`}
                  onMouseEnter={() => setSelectedHeroIdx(idx)}
                  onClick={() => setSelectedHeroIdx(idx)}
                  aria-label={`Preview screen ${idx + 1}`}
                  className={`relative w-12 h-8 overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-[#d4af37] scale-105 opacity-100 ring-1 ring-[#d4af37]'
                      : 'border-white/20 opacity-55 hover:opacity-95'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${cs.title} preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                </button>
              );
            })}
            <span className="font-mono text-[11px] text-[#2dd4bf] pl-2 tabular-nums whitespace-nowrap">
              +{cs.galleryImages.length} screens in case study
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {cs.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[#0d1628] border border-[#d4af37]/20 font-mono text-[10px] text-[#cbd5e1]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary Description */}
      <div className="p-4 sm:p-5 bg-[#0a101d] border border-[#d4af37]/25 space-y-2">
        <div className="font-hud text-xs font-bold uppercase tracking-[0.2em] text-[#2dd4bf]">
          PROJECT OVERVIEW · {cs.client.toUpperCase()}
        </div>
        <p className="font-sans text-xs sm:text-sm text-[#e2e8f0] leading-relaxed">
          {cs.description}
        </p>
      </div>

      {/* Full Editorial Case Study Sections (Background, Core Problem, Approach & Process, Results & Impact) */}
      <div className="space-y-6">
        {visibleSections.map((section, secIdx) => {
          const originalIdx = cs.sections.findIndex((s) => s.id === section.id);
          const displayNum = String((originalIdx >= 0 ? originalIdx : secIdx) + 1).padStart(
            2,
            '0'
          );
          return (
            <section
              key={section.id}
              id={`cs-section-${section.id}`}
              className="p-5 sm:p-6 bg-[#080d18] border border-[#d4af37]/25 space-y-3"
            >
              <div className="flex items-baseline gap-2.5 pb-3 border-b border-[#d4af37]/20">
                <span
                  className="font-mono text-xs font-bold tabular-nums"
                  style={{ color: accentColor }}
                >
                  {displayNum}.
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#f8f5ee] tracking-wide">
                  {section.title}
                </h3>
              </div>

              <div>{section.blocks.map((block, bIdx) => renderBlock(block, bIdx))}</div>
            </section>
          );
        })}
      </div>

      {/* Complete Gallery Strip of All Project Screens */}
      <section className="p-5 bg-[#080d18] border border-[#d4af37]/25 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/20">
          <span className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
            COMPLETE ARTIFACT &amp; SCREEN GALLERY ({cs.galleryImages.length + 1} VISUALS)
          </span>
          <span className="font-mono text-[10px] text-[#94a3b8]">
            Click any visual to inspect full screen
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[cs.heroImage, ...cs.galleryImages].map((imgUrl, i) => (
            <figure
              key={imgUrl + i}
              onClick={() =>
                setLightboxImage({
                  src: imgUrl,
                  alt: `${cs.title} — Screen ${i + 1}`,
                })
              }
              className="group relative aspect-[16/10] bg-[#04070e] border border-[#d4af37]/25 hover:border-[#d4af37] overflow-hidden cursor-zoom-in flex items-center justify-center p-1"
            >
              <img
                src={imgUrl}
                alt={`${cs.title} screen ${i + 1}`}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-[#05070b]/85 border border-[#d4af37]/30 font-mono text-[9px] text-[#cbd5e1]">
                #{String(i + 1).padStart(2, '0')}
              </span>
            </figure>
          ))}
        </div>
      </section>

      {/* Full-Resolution Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full resolution image preview"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-[#020408]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 px-3.5 py-1.5 bg-[#131d31] hover:bg-[#d4af37] hover:text-[#05070b] border border-[#d4af37] font-hud text-xs font-bold uppercase tracking-wider text-[#f8f5ee] cursor-pointer"
          >
            Close Preview [✕]
          </button>
          <img
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            className="max-w-full max-h-[84vh] object-contain border border-[#d4af37]/40 shadow-2xl bg-[#050811]"
            referrerPolicy="no-referrer"
          />
          {lightboxImage.alt && (
            <div className="mt-3 font-mono text-xs text-[#fde68a] text-center max-w-2xl">
              {lightboxImage.alt}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

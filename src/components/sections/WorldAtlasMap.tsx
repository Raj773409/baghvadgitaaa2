import React, { useMemo } from 'react';
import type { ParticipatingCountry } from '../../content/countryContent';
import { WORLD_CONTINENT_POLYGONS } from '../../utils/worldLandmasses';
import { curvedConnectionArcPath, projectEquirectangular } from '../../utils/geodesy';
import { useI18n } from '../../i18n';

interface WorldAtlasMapProps {
  countries: ReadonlyArray<ParticipatingCountry>;
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
}

const SVG_W = 1000;
const SVG_H = 500;

export const WorldAtlasMap: React.FC<WorldAtlasMapProps> = ({
  countries,
  selectedCountryId,
  onSelectCountry,
}) => {
  const { t } = useI18n();

  const continentPaths = useMemo(() => {
    return WORLD_CONTINENT_POLYGONS.map((poly) =>
      poly
        .map(([lon, lat], idx) => {
          const pt = projectEquirectangular(lat, lon, SVG_W, SVG_H);
          return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
        })
        .join(' ') + ' Z',
    );
  }, []);

  const indiaOrigin = useMemo(() => {
    const india = countries.find((c) => c.id === 'india') ?? countries[0];
    return projectEquirectangular(india.lat, india.lon, SVG_W, SVG_H);
  }, [countries]);

  return (
    <div className="relative w-full bg-[#0C1728] border border-[var(--border-hairline-dark)] overflow-hidden">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto block select-none"
        role="img"
        aria-label={t('global.heading')}
      >
        {/* Subtle Graticule Meridians & Parallels */}
        {[-120, -60, 0, 60, 120].map((lon) => {
          const x = projectEquirectangular(0, lon, SVG_W, SVG_H).x;
          return (
            <line
              key={`lon-${lon}`}
              x1={x}
              y1={0}
              x2={x}
              y2={SVG_H}
              stroke="rgba(245,240,231,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = projectEquirectangular(lat, 0, SVG_W, SVG_H).y;
          return (
            <line
              key={`lat-${lat}`}
              x1={0}
              y1={y}
              x2={SVG_W}
              y2={y}
              stroke={lat === 0 ? 'rgba(213,172,112,0.2)' : 'rgba(245,240,231,0.06)'}
              strokeWidth="1"
            />
          );
        })}

        {/* Continental Landmasses */}
        {continentPaths.map((d, idx) => (
          <path
            key={`continent-${idx}`}
            d={d}
            fill="#243B59"
            stroke="#435B78"
            strokeWidth="1"
          />
        ))}

        {/* Restrained Geodesic Connection Arcs from India to Participating Nations */}
        {countries
          .filter((c) => c.id !== 'india')
          .map((country) => {
            const pt = projectEquirectangular(country.lat, country.lon, SVG_W, SVG_H);
            const active = country.id === selectedCountryId;
            return (
              <path
                key={`arc-${country.id}`}
                d={curvedConnectionArcPath(indiaOrigin, pt)}
                fill="none"
                stroke={active ? '#E9AE78' : 'rgba(213, 172, 112, 0.3)'}
                strokeWidth={active ? '1.75' : '0.9'}
              />
            );
          })}

        {/* Interactive Country Nodes */}
        {countries.map((country) => {
          const pt = projectEquirectangular(country.lat, country.lon, SVG_W, SVG_H);
          const active = country.id === selectedCountryId;
          return (
            <g key={country.id}>
              {active && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={12}
                  fill="none"
                  stroke="#E9AE78"
                  strokeWidth="1.3"
                  opacity="0.78"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={active ? 5.5 : 3.5}
                fill={active ? '#E9AE78' : '#F5F0E7'}
                stroke="#101D32"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-150"
                onClick={() => onSelectCountry(country.id)}
              >
                <title>{t(country.nameKey)}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

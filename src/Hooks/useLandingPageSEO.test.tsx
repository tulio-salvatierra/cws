import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Layout from '../components/Layout/Layout';
import { landingPagesData } from '../data/landingPagesData';
import { buildServiceJsonLd } from '../lib/jsonld';
import { useLandingPageSEO } from './useLandingPageSEO';

vi.mock('../components/Header/Header', () => ({ default: () => null }));
vi.mock('../components/Footer/Footer', () => ({ default: () => null }));
vi.mock('../components/Layout/AppBackground', () => ({ default: () => null }));

const landing = landingPagesData[0];
const landingPath = `/landing/${landing.id}`;

function LandingRoute() {
  useLandingPageSEO(landing);
  return <Link to="/">Home</Link>;
}

describe('landing service structured data', () => {
  it.each(landingPagesData)('omits review and price data for $id', (page) => {
    expect(page).not.toHaveProperty('rating');
    expect(page).not.toHaveProperty('reviews');
    expect(page).not.toHaveProperty('trustSection.testimonial');
    expect(page).not.toHaveProperty('priceNumberUSD');
    expect(page).not.toHaveProperty('solution.startingPrice');

    const schema = buildServiceJsonLd(page);
    expect(schema).toMatchObject({
      '@type': 'Service',
      name: page.serviceType,
      description: page.meta.description,
      areaServed: page.localHook.areas,
      url: `https://www.cicerowebstudio.xyz/landing/${page.id}`,
      provider: { '@id': 'https://www.cicerowebstudio.xyz/#organization' },
    });
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(schema).not.toHaveProperty('review');
    expect(schema).not.toHaveProperty('offers');
  });

  it('preserves the same LocalBusiness script when entering and leaving a landing route', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Link to={landingPath}>Landing</Link>} />
            <Route path={landingPath} element={<LandingRoute />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const organizationSelector = 'script[data-jsonld-id="organization"]';
    const serviceSelector = 'script[data-jsonld-id="landing-service"]';
    const organization = document.querySelector(organizationSelector);
    expect(JSON.parse(organization!.textContent!)['@type']).toBe('LocalBusiness');

    fireEvent.click(screen.getByRole('link', { name: 'Landing' }));
    expect(document.querySelectorAll(organizationSelector)).toHaveLength(1);
    expect(document.querySelector(organizationSelector)).toBe(organization);
    expect(document.querySelectorAll(serviceSelector)).toHaveLength(1);

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(document.querySelectorAll(organizationSelector)).toHaveLength(1);
    expect(document.querySelector(organizationSelector)).toBe(organization);
    expect(document.querySelector(serviceSelector)).toBeNull();
  });
});

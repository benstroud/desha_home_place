// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Production URL. Because GitHub Pages serves this site at the domain root
  // (franklin-desha-house.com -> benstroud.github.io via CNAME/A records),
  // base is '/' — NOT '/desha_home_place/'.
  site: 'https://franklin-desha-house.com',
  base: '/',
  trailingSlash: 'never',
});

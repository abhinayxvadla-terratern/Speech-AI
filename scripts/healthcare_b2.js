// Combined Healthcare B2 variants (77-112)
import { healthcareB2Part1 } from './healthcare_b2_part1.js';
import { healthcareB2Part2 } from './healthcare_b2_part2.js';

export const healthcareB2 = {
  ...healthcareB2Part1,
  ...healthcareB2Part2
};

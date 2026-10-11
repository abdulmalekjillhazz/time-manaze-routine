import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { getBangladeshPublicHolidays } from '../services/holidays.js';

const yearSchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
}).strict();

export function calendarRouter() {
  const r = Router();
  r.get(
    '/holidays',
    rateLimit({ name: 'calendar-holidays', limit: 30, windowMs: 60 * 1000, by: 'ip' }),
    validate({ query: yearSchema }),
    (req, res) => {
      res.json({ year: req.query.year, holidays: getBangladeshPublicHolidays(req.query.year) });
    }
  );
  return r;
}

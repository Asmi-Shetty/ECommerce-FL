import { Router } from 'express';
import { createTicket, getTickets, addMessage, updateTicketStatus } from '../controllers/support.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getTickets);
router.post('/tickets/:id/messages', protect, addMessage);
router.patch('/tickets/:id/status', protect, updateTicketStatus);

export default router;

import { Response } from 'express';
import prisma from '../config/db';

export const createTicket = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { orderId, type, subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required' });
      return;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        orderId,
        type: type || 'GENERAL',
        subject,
        messages: {
          create: [{ senderId: userId, message }]
        }
      },
      include: { messages: true }
    });

    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error creating ticket' });
  }
};

export const getTickets = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Admins see all tickets, users see their own
    const whereClause = isAdmin ? {} : { userId };

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { name: true, role: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading tickets' });
  }
};

export const addMessage = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // ticket ID
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Only ticket owner or admin can reply
    if (ticket.userId !== userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to reply to this ticket' });
      return;
    }

    const newMessage = await prisma.supportMessage.create({
      data: { ticketId: id, senderId: userId, message },
      include: { sender: { select: { name: true, role: true } } }
    });

    // Update ticket status to IN_PROGRESS if admin replies, or leave it if already resolved
    if (req.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
    }

    res.json({ message: 'Reply sent', supportMessage: newMessage });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error sending message' });
  }
};

export const updateTicketStatus = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });

    res.json({ message: 'Ticket status updated', ticket: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error updating ticket' });
  }
};

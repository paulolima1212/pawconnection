import { ForbiddenError, ValidationError } from '../../../../shared/domain/result';
import { Message } from './message.entity';
import { MessageStatus } from '../message-status';
import { CHAT_EVENTS } from '../events/chat-events';

const meta = { correlationId: 'c-1', userId: 'user-1' };

describe('Message aggregate', () => {
  it('creates a message and records MessageSent', () => {
    const message = Message.createNew({
      conversationId: 'conv-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      rawContent: 'Hello',
      metadata: meta,
    });

    expect(message.content).toBe('Hello');
    expect(message.status).toBe(MessageStatus.SENT);

    const events = message.pullEvents();
    expect(events.map((e) => e.eventType)).toEqual([CHAT_EVENTS.MESSAGE_SENT]);
    expect(events[0].aggregateId).toBe(message.id);
  });

  it('allows author to soft-delete', () => {
    const message = Message.createNew({
      conversationId: 'conv-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      rawContent: 'Bye',
      metadata: meta,
    });
    message.pullEvents();

    message.softDelete('user-1', meta);
    expect(message.status).toBe(MessageStatus.DELETED);
    expect(message.content).toBe('');

    const events = message.pullEvents();
    expect(events.map((e) => e.eventType)).toEqual([CHAT_EVENTS.MESSAGE_DELETED]);
  });

  it('rejects delete by non-author', () => {
    const message = Message.createNew({
      conversationId: 'conv-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      rawContent: 'Hi',
      metadata: meta,
    });
    expect(() => message.softDelete('user-2', meta)).toThrow(ForbiddenError);
  });

  it('rejects editing deleted messages', () => {
    const message = Message.createNew({
      conversationId: 'conv-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      rawContent: 'Hi',
      metadata: meta,
    });
    message.softDelete('user-1', meta);
    expect(() => message.edit('nope', 'user-1', meta)).toThrow(ValidationError);
  });
});

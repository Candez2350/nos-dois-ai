CREATE EVENT TRIGGER generate_recurring_transactions_trigger
ON SCHEDULE
EVERY '1 day'
STARTS (date_trunc('hour', now() + interval '1 hour')) -- Inicia na próxima hora cheia
DO
  CALL generate_recurring_transactions();

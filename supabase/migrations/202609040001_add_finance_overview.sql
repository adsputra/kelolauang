BEGIN;

CREATE OR REPLACE FUNCTION public.get_finance_overview(p_as_of DATE)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', p_as_of)::date AS current_month_start,
      (date_trunc('month', p_as_of) + INTERVAL '1 month')::date AS next_month_start,
      (date_trunc('month', p_as_of) - INTERVAL '4 months')::date AS first_chart_month
  ),
  totals AS (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'income'
          AND date >= bounds.current_month_start
          AND date < bounds.next_month_start
      ), 0) AS current_month_income,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'expense'
          AND date >= bounds.current_month_start
          AND date < bounds.next_month_start
      ), 0) AS current_month_expense
    FROM bounds
    LEFT JOIN public.transactions
      ON user_id = (SELECT auth.uid())
  ),
  months AS (
    SELECT generate_series(
      bounds.first_chart_month::timestamp,
      bounds.current_month_start::timestamp,
      INTERVAL '1 month'
    )::date AS month_start
    FROM bounds
  ),
  monthly_cash_flow AS (
    SELECT
      months.month_start,
      COALESCE(SUM(transactions.amount) FILTER (WHERE transactions.type = 'income'), 0) AS income,
      COALESCE(SUM(transactions.amount) FILTER (WHERE transactions.type = 'expense'), 0) AS expense
    FROM months
    LEFT JOIN public.transactions AS transactions
      ON transactions.user_id = (SELECT auth.uid())
      AND transactions.date >= months.month_start
      AND transactions.date < (months.month_start + INTERVAL '1 month')::date
    GROUP BY months.month_start
  ),
  expense_categories AS (
    SELECT
      transactions.category,
      SUM(transactions.amount) AS amount
    FROM bounds
    JOIN public.transactions AS transactions
      ON transactions.user_id = (SELECT auth.uid())
      AND transactions.type = 'expense'
      AND transactions.date >= bounds.current_month_start
      AND transactions.date < bounds.next_month_start
    GROUP BY transactions.category
  )
  SELECT jsonb_build_object(
    'asOfDate', p_as_of::text,
    'totalIncome', totals.total_income::text,
    'totalExpense', totals.total_expense::text,
    'currentMonthIncome', totals.current_month_income::text,
    'currentMonthExpense', totals.current_month_expense::text,
    'monthlyCashFlow', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', to_char(month_start, 'YYYY-MM'),
          'income', income::text,
          'expense', expense::text
        )
        ORDER BY month_start
      )
      FROM monthly_cash_flow
    ), '[]'::jsonb),
    'expenseByCategory', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('category', category, 'amount', amount::text)
        ORDER BY amount DESC, category
      )
      FROM expense_categories
    ), '[]'::jsonb)
  )
  FROM totals
  WHERE p_as_of BETWEEN DATE '1900-01-01' AND DATE '2100-12-31';
$$;

REVOKE ALL ON FUNCTION public.get_finance_overview(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_finance_overview(DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_finance_overview(DATE) TO authenticated;

COMMIT;

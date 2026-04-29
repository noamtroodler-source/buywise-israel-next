UPDATE public.properties
SET
  address = CASE id
    WHEN '3bcfeebe-1393-4f7a-aaf3-db7f1cc95561' THEN 'Shalom Aleichem 12, Tel Aviv'
    WHEN '81485c99-ea73-474e-901c-ad121ee5277b' THEN 'Bograshov 60, Old North, Tel Aviv'
    WHEN 'f7edbe8b-b1dd-4265-9569-77fc415865e2' THEN 'Miriam HaHashmonait 26, New North, Tel Aviv'
    WHEN '2a015113-1cb1-4954-a632-601417588c13' THEN 'Lapin 14, Neve Tzedek, Tel Aviv'
    WHEN '3ea81912-9b92-4939-8dc1-b3ecf046c70d' THEN 'Ashdod'
    WHEN 'b4cd6f1a-52eb-4446-b930-f4dbe3822887' THEN 'Trumpeldor 10, Central Tel Aviv'
    WHEN '6173d707-8ebf-458b-a643-4ff26db234ec' THEN 'Gruzenberg 21, Central Tel Aviv'
    WHEN '38c381e2-7c60-483c-874d-234738fe7373' THEN 'Shalom Aleichem 18, Old North, Tel Aviv'
    WHEN '63731831-d5ff-43ba-8f50-a4ba03a43698' THEN 'Second line to the sea, Ashdod'
    ELSE address
  END,
  neighborhood = CASE id
    WHEN '3ea81912-9b92-4939-8dc1-b3ecf046c70d' THEN 'Central / Old North'
    WHEN 'b4cd6f1a-52eb-4446-b930-f4dbe3822887' THEN 'Central Tel Aviv'
    WHEN '63731831-d5ff-43ba-8f50-a4ba03a43698' THEN 'Central / Old North'
    ELSE neighborhood
  END,
  updated_at = now()
WHERE (primary_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89' OR claimed_by_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89')
  AND id IN (
    '3bcfeebe-1393-4f7a-aaf3-db7f1cc95561',
    '81485c99-ea73-474e-901c-ad121ee5277b',
    'f7edbe8b-b1dd-4265-9569-77fc415865e2',
    '2a015113-1cb1-4954-a632-601417588c13',
    '3ea81912-9b92-4939-8dc1-b3ecf046c70d',
    'b4cd6f1a-52eb-4446-b930-f4dbe3822887',
    '6173d707-8ebf-458b-a643-4ff26db234ec',
    '38c381e2-7c60-483c-874d-234738fe7373',
    '63731831-d5ff-43ba-8f50-a4ba03a43698'
  );
-- Fix JRE logo URL
UPDATE agencies 
SET logo_url = 'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/agency-logos/jre-logo.png'
WHERE id = '0058c3aa-2331-4a34-9c0e-c11aa984deff';

-- Suspend agents without proper photos
UPDATE agents SET status = 'suspended', is_verified = false
WHERE id IN (
  '29d01e64-0cb4-42e3-b205-955104bcce7c',
  'bbaa2745-58b7-4b01-83d9-69ee7f450149',
  '40ccbeb2-80e8-4a72-9013-e9bea1c5de0b',
  '382d042b-abac-471d-b9cb-5ad3ff03a0ef',
  '13814a19-ca94-4d78-8f10-2471b8624add'
);

-- Reassign Jonas's 98 listings round-robin across 6 agents with photos
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM properties
  WHERE agent_id = '29d01e64-0cb4-42e3-b205-955104bcce7c'
),
agent_map(idx, agent_id) AS (
  VALUES
    (0, 'fba6be19-90a9-432d-8123-acfd99c9ecda'::uuid),
    (1, '10ab7c2e-9115-44df-96b0-5e06c3eca402'::uuid),
    (2, 'f30d805d-426f-4573-b588-267b7c898c99'::uuid),
    (3, 'e5e27f4b-f1e2-4cf6-8694-904e00d7bbbe'::uuid),
    (4, '878e6973-5d64-483e-a2fc-72787dde1d27'::uuid),
    (5, '84875b06-1c2c-4f80-9298-cb2f4cccded4'::uuid)
)
UPDATE properties p
SET agent_id = am.agent_id
FROM numbered n
JOIN agent_map am ON am.idx = (n.rn - 1) % 6
WHERE p.id = n.id;
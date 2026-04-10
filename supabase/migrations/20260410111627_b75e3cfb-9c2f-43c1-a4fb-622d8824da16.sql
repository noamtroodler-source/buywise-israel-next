UPDATE properties 
SET street_view_url = NULL, street_view_type = 'street_view'
WHERE street_view_url LIKE 'https://maps.googleapis.com/%';
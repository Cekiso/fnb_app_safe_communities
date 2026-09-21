/*
# Seed Expanded Support Services (20+ entries across 4 provinces)

## Purpose
Expand support_services with real services across Gauteng, Western Cape,
KwaZulu-Natal, and Eastern Cape. All entries marked verified=false with
"Sample data - verify before launch" in the description.

## Data inserted
22 entries: police stations, Thuthuzela Care Centres, shelters, clinics,
legal aid offices across 4 provinces.

## Notes
1. All entries verified=false — must be verified before launch.
2. No invented phone numbers — where unknown, phone is NULL.
3. Coordinates are approximate city-centre coordinates — verify exact locations.
4. Uses ON CONFLICT DO NOTHING for idempotency.
*/

INSERT INTO support_services (name, type, address, phone, description, latitude, longitude, is_verified, hours, languages) VALUES
-- Gauteng (6)
('Johannesburg Central Police Station', 'police', '20 Von Wielligh St, Johannesburg, Gauteng', '10111', 'Sample data - verify before launch. SAPS police station in central Johannesburg.', -26.2041, 28.0473, false, '24/7', ARRAY['English', 'isiZulu', 'Afrikaans']),
('Sandton Police Station', 'police', 'Witkoppen Rd, Sandton, Gauteng', '10111', 'Sample data - verify before launch. SAPS police station serving Sandton area.', -26.1076, 28.0567, false, '24/7', ARRAY['English', 'Afrikaans']),
('Thuthuzela Care Centre - Johannesburg', 'thuthuzela', 'Johannesburg, Gauteng', NULL, 'Sample data - verify before launch. Thuthuzela Care Centre providing survivor-centred services for rape and GBV survivors.', -26.2041, 28.0473, false, 'Office hours', ARRAY['English', 'isiZulu', 'isiXhosa']),
('POWA (People Opposing Women Abuse) Shelter', 'shelter', 'Johannesburg, Gauteng', NULL, 'Sample data - verify before launch. POWA provides shelter and support services for women survivors of GBV.', -26.2041, 28.0473, false, '24/7', ARRAY['English', 'isiZulu']),
('Charlotte Maxeke Hospital - GBV Services', 'clinic', 'Parktown, Johannesburg, Gauteng', NULL, 'Sample data - verify before launch. Academic hospital with GBV and sexual assault services.', -26.1830, 28.0510, false, '24/7', ARRAY['English', 'isiZulu', 'Afrikaans']),
('Legal Aid South Africa - Johannesburg', 'legal_aid', 'Johannesburg, Gauteng', NULL, 'Sample data - verify before launch. Free legal aid for qualifying individuals.', -26.2041, 28.0473, false, 'Office hours', ARRAY['English', 'Afrikaans']),

-- Western Cape (6)
('Cape Town Central Police Station', 'police', 'Buitenkant St, Cape Town, Western Cape', '10111', 'Sample data - verify before launch. SAPS police station in central Cape Town.', -33.9249, 18.4241, false, '24/7', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Mitchells Plain Police Station', 'police', 'Mitchells Plain, Cape Town, Western Cape', '10111', 'Sample data - verify before launch. SAPS police station serving Mitchells Plain.', -34.0544, 18.6181, false, '24/7', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Thuthuzela Care Centre - Cape Town', 'thuthuzela', 'Cape Town, Western Cape', NULL, 'Sample data - verify before launch. Thuthuzela Care Centre providing survivor-centred services.', -33.9249, 18.4241, false, 'Office hours', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Rape Crisis Cape Town', 'counselling', 'Cape Town, Western Cape', NULL, 'Sample data - verify before launch. Counselling and support for rape survivors in Cape Town.', -33.9249, 18.4241, false, 'Office hours', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Groote Schuur Hospital - GBV Services', 'clinic', 'Observatory, Cape Town, Western Cape', NULL, 'Sample data - verify before launch. Tertiary hospital with GBV and sexual assault services.', -33.9400, 18.4630, false, '24/7', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Legal Aid South Africa - Cape Town', 'legal_aid', 'Cape Town, Western Cape', NULL, 'Sample data - verify before launch. Free legal aid for qualifying individuals.', -33.9249, 18.4241, false, 'Office hours', ARRAY['English', 'Afrikaans']),

-- KwaZulu-Natal (5)
('Durban Central Police Station', 'police', 'Stanger St, Durban, KwaZulu-Natal', '10111', 'Sample data - verify before launch. SAPS police station in central Durban.', -29.8587, 31.0218, false, '24/7', ARRAY['English', 'isiZulu']),
('Phoenix Police Station', 'police', 'Phoenix, Durban, KwaZulu-Natal', '10111', 'Sample data - verify before launch. SAPS police station serving Phoenix area.', -29.7194, 30.9928, false, '24/7', ARRAY['English', 'isiZulu']),
('Thuthuzela Care Centre - Durban', 'thuthuzela', 'Durban, KwaZulu-Natal', NULL, 'Sample data - verify before launch. Thuthuzela Care Centre providing survivor-centred services.', -29.8587, 31.0218, false, 'Office hours', ARRAY['English', 'isiZulu']),
('KZN Domestic Violence Help Centre', 'shelter', 'Durban, KwaZulu-Natal', NULL, 'Sample data - verify before launch. Shelter and support for domestic violence survivors.', -29.8587, 31.0218, false, '24/7', ARRAY['English', 'isiZulu']),
('Addington Hospital - GBV Services', 'clinic', 'Point Rd, Durban, KwaZulu-Natal', NULL, 'Sample data - verify before launch. Provincial hospital with GBV and sexual assault services.', -29.8730, 31.0560, false, '24/7', ARRAY['English', 'isiZulu']),

-- Eastern Cape (5)
('Gqeberha (Port Elizabeth) Central Police Station', 'police', 'Gqeberha, Eastern Cape', '10111', 'Sample data - verify before launch. SAPS police station in central Gqeberha.', -33.9608, 25.6022, false, '24/7', ARRAY['English', 'isiXhosa', 'Afrikaans']),
('East London Police Station', 'police', 'East London, Eastern Cape', '10111', 'Sample data - verify before launch. SAPS police station in East London.', -33.0150, 27.9116, false, '24/7', ARRAY['English', 'isiXhosa']),
('Thuthuzela Care Centre - Gqeberha', 'thuthuzela', 'Gqeberha, Eastern Cape', NULL, 'Sample data - verify before launch. Thuthuzela Care Centre providing survivor-centred services.', -33.9608, 25.6022, false, 'Office hours', ARRAY['English', 'isiXhosa']),
('Eastern Cape Shelter for Women', 'shelter', 'East London, Eastern Cape', NULL, 'Sample data - verify before launch. Shelter and support for women survivors of GBV.', -33.0150, 27.9116, false, '24/7', ARRAY['English', 'isiXhosa']),
('Legal Aid South Africa - Gqeberha', 'legal_aid', 'Gqeberha, Eastern Cape', NULL, 'Sample data - verify before launch. Free legal aid for qualifying individuals.', -33.9608, 25.6022, false, 'Office hours', ARRAY['English', 'isiXhosa', 'Afrikaans'])
ON CONFLICT DO NOTHING;

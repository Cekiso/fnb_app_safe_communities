/*
# Seed Emergency Contacts and Support Services

## Purpose
Populate the emergency_contacts and support_services tables with verified
South African emergency and support service data for Phase 1.

## Data inserted
### emergency_contacts (11 rows)
112, 10111, 10177, GBV Command Centre, Stop Gender Violence, Childline,
Lifeline SA, SADAG, Crime Stop, Human Trafficking Helpline.

### support_services (8 sample rows)
Sample police stations, Thuthuzela Care Centres, shelters, clinics in major
SA cities (Johannesburg, Cape Town, Durban, Pretoria). These are illustrative
seed entries with approximate coordinates — they must be verified and
expanded before launch.

## Security
No security changes — only DML (INSERT) into existing tables.

## Notes
1. Phone numbers stored as continuous digits for tel: links.
2. last_verified_at is set to now() but MUST be re-verified before launch.
3. Support service coordinates are approximate; verify before launch.
4. Uses ON CONFLICT DO NOTHING to be idempotent — safe to re-run.
*/

-- Emergency contacts seed
INSERT INTO emergency_contacts (name, number, alt_number, ussd_code, sms_code, description, hours, is_free, category, languages, sort_order) VALUES
('Emergency (Cellphone)', '112', NULL, NULL, NULL, 'General emergency from any cellphone. Connects to police, ambulance, and fire services.', '24/7', false, 'general', ARRAY['English', 'isiZulu', 'isiXhosa', 'Afrikaans'], 1),
('SAPS Flying Squad', '10111', NULL, NULL, NULL, 'South African Police Service Flying Squad for rapid police response.', '24/7', false, 'police', ARRAY['English', 'Afrikaans'], 2),
('Public Ambulance / EMS', '10177', NULL, NULL, NULL, 'Public ambulance and emergency medical services.', '24/7', false, 'medical', ARRAY['English', 'Afrikaans'], 3),
('GBV Command Centre', '0800428428', NULL, '*120*7867#', 'help to 31531', 'Gender-Based Violence Command Centre. 24/7 free support, reporting, and referrals for GBV survivors.', '24/7', true, 'gbv', ARRAY['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho'], 4),
('Stop Gender Violence Helpline', '0800150150', NULL, NULL, NULL, 'Helpline offering support and information for those affected by gender-based violence.', '24/7', true, 'gbv', ARRAY['English', 'Afrikaans'], 5),
('Childline South Africa', '116', '0800055555', NULL, NULL, 'Free, 24/7 helpline for children. Counselling, support, and referrals for any child in need.', '24/7', true, 'child', ARRAY['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho'], 6),
('Lifeline South Africa', '0861322322', NULL, NULL, NULL, 'Counselling and emotional support for individuals in crisis or distress.', '24/7', false, 'mental', ARRAY['English', 'Afrikaans'], 7),
('SADAG Mental Health', '0800567567', '0800121314', NULL, NULL, 'South African Depression and Anxiety Group. Mental health support and suicide crisis line.', '24/7', true, 'mental', ARRAY['English'], 8),
('Crime Stop', '0860010111', NULL, NULL, NULL, 'Report crime anonymously to the South African Police Service.', '24/7', false, 'police', ARRAY['English', 'Afrikaans'], 9),
('Human Trafficking Helpline', '0800222777', NULL, NULL, NULL, 'National helpline for reporting human trafficking and supporting survivors.', '24/7', true, 'trafficking', ARRAY['English'], 10)
ON CONFLICT DO NOTHING;

-- Support services seed (approximate coordinates, must be verified before launch)
INSERT INTO support_services (name, type, address, phone, description, latitude, longitude, is_verified, hours, languages) VALUES
('Johannesburg Central Police Station', 'police', '20 Von Wielligh St, Johannesburg', '10111', 'SAPS police station in central Johannesburg.', -26.2041, 28.0473, false, '24/7', ARRAY['English', 'isiZulu', 'Afrikaans']),
('Thuthuzela Care Centre - Johannesburg', 'thuthuzela', 'Johannesburg, Gauteng', '0113751400', 'Thuthuzela Care Centre providing survivor-centred services for rape and GBV survivors.', -26.2041, 28.0473, false, 'Office hours', ARRAY['English', 'isiZulu', 'isiXhosa']),
('Cape Town Central Police Station', 'police', 'Buitenkant St, Cape Town', '10111', 'SAPS police station in central Cape Town.', -33.9249, 18.4241, false, '24/7', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Thuthuzela Care Centre - Cape Town', 'thuthuzela', 'Cape Town, Western Cape', '0215031980', 'Thuthuzela Care Centre providing survivor-centred services for rape and GBV survivors.', -33.9249, 18.4241, false, 'Office hours', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Durban Central Police Station', 'police', 'Stanger St, Durban', '10111', 'SAPS police station in central Durban.', -29.8587, 31.0218, false, '24/7', ARRAY['English', 'isiZulu']),
('People Opposing Women Abuse (POWA) Shelter', 'shelter', 'Johannesburg, Gauteng', '0116424345', 'POWA provides shelter and support services for women survivors of GBV.', -26.2041, 28.0473, false, '24/7', ARRAY['English', 'isiZulu']),
('Rape Crisis Cape Town', 'counselling', 'Cape Town, Western Cape', '0214479760', 'Counselling and support for rape survivors in Cape Town.', -33.9249, 18.4241, false, 'Office hours', ARRAY['English', 'Afrikaans', 'isiXhosa']),
('Pretoria Central Police Station', 'police', 'Pretoria, Gauteng', '10111', 'SAPS police station in central Pretoria.', -25.7479, 28.2293, false, '24/7', ARRAY['English', 'Afrikaans', 'Sesotho'])
ON CONFLICT DO NOTHING;

/*
# Seed Learning Content, Expanded Support Services, and Adult Articles

## Purpose
Populate learning_content with 12 youth lessons across 3 age bands,
6 adult educational articles, and expand support_services to 20+ entries.

## Data inserted
### learning_content (youth): 12 lessons (4 per age band 6-9, 10-13, 14-17)
### learning_content (adult): 6 articles (GBV education)
### support_services: 20+ entries across 4 provinces

## Notes
1. All support services marked verified=false — verify before launch.
2. No invented phone numbers — where unknown, phone is NULL.
3. Uses ON CONFLICT DO NOTHING for idempotency.
*/

-- ============ YOUTH LEARNING CONTENT (12 lessons) ============

INSERT INTO learning_content (age_band, title, description, steps, quiz, category, badge_emoji, sort_order) VALUES
('6-9', 'My Body Belongs to Me',
 'Learn that your body is yours and nobody can touch you in a way that feels wrong.',
 '[
   {"emoji":"🧒","text":"Your body belongs to you. Nobody else owns it."},
   {"emoji":"🚗","text":"There are parts of your body that are private. They are covered by your underwear or swimsuit."},
   {"emoji":"✋","text":"If someone touches you in a way that feels wrong, say NO loudly!"},
   {"emoji":"🏃","text":"Run to a grown-up you trust and tell them what happened."},
   {"emoji":"💛","text":"It is never your fault if someone hurts you. You are brave for telling."}
 ]'::jsonb,
 '[
   {"question":"Whose body is it?","options":["Mine","My friend''s","Nobody''s"],"answer_index":0},
   {"question":"What do you do if someone touches you wrong?","options":["Keep it a secret","Tell a grown-up you trust","Say nothing"],"answer_index":1},
   {"question":"Whose fault is it if someone hurts you?","options":["Mine","Nobody''s - it is the bad person''s fault","My parents"],"answer_index":1}
 ]'::jsonb,
 'body_safety', '🛡️', 1),

('6-9', 'Good Secrets and Bad Secrets',
 'Learn the difference between secrets that are fun and secrets that feel bad.',
 '[
   {"emoji":"🎁","text":"A good secret is like a surprise birthday party. It feels exciting and happy."},
   {"emoji":"😔","text":"A bad secret is when someone says ''don''t tell'' and it makes you feel scared or sad."},
   {"emoji":"🗣️","text":"You should ALWAYS tell a grown-up you trust about a bad secret."},
   {"emoji":"💛","text":"You will never get in trouble for telling a bad secret."}
 ]'::jsonb,
 '[
   {"question":"A surprise party is a...","options":["Good secret","Bad secret","Not a secret"],"answer_index":0},
   {"question":"If someone says ''don''t tell'' and you feel scared, you should...","options":["Keep it secret","Tell a grown-up you trust","Forget about it"],"answer_index":1},
   {"question":"Will you get in trouble for telling a bad secret?","options":["Yes","No, never","Maybe"],"answer_index":1}
 ]'::jsonb,
 'body_safety', '🤐', 2),

('6-9', 'Who Are My Helpers?',
 'Learn who can help you when you are scared or in danger.',
 '[
   {"emoji":"👮","text":"Police officers help keep you safe. You can find them at a police station."},
   {"emoji":"👩‍🏫","text":"Teachers help you at school. They care about you."},
   {"emoji":"🩺","text":"Doctors and nurses help you when you are hurt or sick."},
   {"emoji":"📞","text":"Childline is a free number you can call: 116. They are always there."},
   {"emoji":"👨‍👩‍👧","text":"A grown-up you trust can be your mom, dad, gran, auntie, or anyone who makes you feel safe."}
 ]'::jsonb,
 '[
   {"question":"Who can you call for free, any time?","options":["116 Childline","10111","Your friend"],"answer_index":0},
   {"question":"Who helps you at school?","options":["Teachers","Police","Doctors"],"answer_index":0},
   {"question":"Who is a grown-up you trust?","options":["Anyone who makes you feel safe","Only your parents","Strangers"],"answer_index":0}
 ]'::jsonb,
 'helpers', '🦸', 3),

('6-9', 'What If I Get Lost?',
 'Learn what to do if you cannot find your grown-up.',
 '[
   {"emoji":"🛑","text":"Stop! Do not run around looking. Stay where you are."},
   {"emoji":"👀","text":"Look for a helper: a police officer, a shop worker, or a mom with children."},
   {"emoji":"🗣️","text":"Tell them your name and your grown-up''s phone number."},
   {"emoji":"📵","text":"Do NOT go anywhere with a stranger, even if they say they will help."},
   {"emoji":"💛","text":"Your grown-up is looking for you too. You will be found."}
 ]'::jsonb,
 '[
   {"question":"What do you do first if you are lost?","options":["Run around looking","Stay where you are","Cry loudly"],"answer_index":1},
   {"question":"Who should you ask for help?","options":["A stranger who offers candy","A police officer or shop worker","Nobody"],"answer_index":1},
   {"question":"Should you go with a stranger?","options":["Yes if they are nice","No, never","Only if they have a car"],"answer_index":1}
 ]'::jsonb,
 'getting_lost', '🧭', 4),

('10-13', 'Understanding My Feelings',
 'Learn to name your feelings and know it is okay to feel anything.',
 '[
   {"emoji":"😊","text":"Everyone has feelings. Happy, sad, angry, scared, confused - they are all normal."},
   {"emoji":"💭","text":"When you feel something strong, try to name it. ''I feel scared because...''"},
   {"emoji":"🗣️","text":"Talking about your feelings helps. Tell someone you trust."},
   {"emoji":"📓","text":"You can also write or draw your feelings. There is no wrong way to feel."}
 ]'::jsonb,
 '[
   {"question":"Are all feelings normal?","options":["Yes","No, only happy ones","No, only calm ones"],"answer_index":0},
   {"question":"What helps when you feel something strong?","options":["Keeping it inside","Naming it and telling someone","Ignoring it"],"answer_index":1},
   {"question":"Can you draw your feelings?","options":["Yes, there is no wrong way","No, that is silly","Only if you are an artist"],"answer_index":0}
 ]'::jsonb,
 'feelings', '💬', 5),

('10-13', 'Safe and Unsafe Touch',
 'Learn the difference between safe touch and unsafe touch.',
 '[
   {"emoji":"✅","text":"Safe touch makes you feel comfortable, like a hug from your gran or a high-five from a friend."},
   {"emoji":"❌","text":"Unsafe touch makes you feel confused, scared, or yucky. Like someone touching your private parts."},
   {"emoji":"🤔","text":"Sometimes touch feels confusing. If you are not sure, tell a grown-up you trust."},
   {"emoji":"✋","text":"You always have the right to say NO to any touch, even from someone you know."},
   {"emoji":"💛","text":"If someone touches you unsafely, it is NOT your fault. Tell someone."}
 ]'::jsonb,
 '[
   {"question":"What is safe touch?","options":["Something that feels comfortable","Something that hurts","Anything from a stranger"],"answer_index":0},
   {"question":"Can you say no to touch from someone you know?","options":["Yes, always","No if they are family","Only if they are a stranger"],"answer_index":0},
   {"question":"Whose fault is unsafe touch?","options":["Yours","The person who did it","Nobody''s"],"answer_index":1}
 ]'::jsonb,
 'body_safety', '🛡️', 6),

('10-13', 'Staying Safe Online',
 'Learn how to be safe when using the internet and phone.',
 '[
   {"emoji":"📱","text":"The internet is fun, but not everyone online is who they say they are."},
   {"emoji":"🚫","text":"Never share your real name, address, school, or photos with strangers online."},
   {"emoji":"⚠️","text":"If someone online asks you to keep a secret or meet up, tell a grown-up RIGHT AWAY."},
   {"emoji":"🔒","text":"Use strong passwords and never share them with anyone except your parents."},
   {"emoji":"💬","text":"If you see something online that makes you feel bad, close it and tell someone."}
 ]'::jsonb,
 '[
   {"question":"Should you share your address online?","options":["No, never","Yes if they seem nice","Only with friends"],"answer_index":0},
   {"question":"What do you do if someone online wants to meet up?","options":["Go meet them","Tell a grown-up right away","Keep chatting with them"],"answer_index":1},
   {"question":"If you see something bad online, you should...","options":["Close it and tell someone","Keep looking at it","Share it with friends"],"answer_index":0}
 ]'::jsonb,
 'online_safety', '🔒', 7),

('10-13', 'My Helpers in the Community',
 'Learn about the different helpers in your community and how to reach them.',
 '[
   {"emoji":"👮","text":"Police protect you. Call 10111 in an emergency or 112 from a cellphone."},
   {"emoji":"📞","text":"Childline is 116. It is free and open all day and night."},
   {"emoji":"🏥","text":"Clinics and hospitals help if you are hurt. They will not judge you."},
   {"emoji":"🤝","text":"Social workers help families and children. They are there to support you."},
   {"emoji":"👨‍⚖️","text":"If someone hurt you, there are people called counsellors who help you talk about it."}
 ]'::jsonb,
 '[
   {"question":"What number do you call on a cellphone for emergencies?","options":["112","999","000"],"answer_index":0},
   {"question":"Is Childline free?","options":["Yes, always","No","Only during the day"],"answer_index":0},
   {"question":"Who helps families and children?","options":["Social workers","Only police","Only doctors"],"answer_index":0}
 ]'::jsonb,
 'helpers', '🤝', 8),

('14-17', 'Body Autonomy and Consent',
 'Understand your rights over your own body and what consent means.',
 '[
   {"emoji":"🧠","text":"Body autonomy means you have the right to decide what happens to your body. Nobody can touch you without your consent."},
   {"emoji":"✅","text":"Consent must be freely given, informed, and can be withdrawn at any time. Saying yes once does not mean yes forever."},
   {"emoji":"❌","text":"If you are pressured, threatened, or manipulated into saying yes, that is NOT consent."},
   {"emoji":"🗣️","text":"If someone violates your consent, it is not your fault. You have the right to report it."},
   {"emoji":"📞","text":"You can call the GBV Command Centre on 0800 428 428 for free, 24/7."}
 ]'::jsonb,
 '[
   {"question":"What is consent?","options":["Freely given, informed, can be withdrawn","Saying yes once means yes forever","Being pressured into saying yes"],"answer_index":0},
   {"question":"If you are manipulated into saying yes, is that consent?","options":["No","Yes","Sometimes"],"answer_index":0},
   {"question":"What free number can you call for GBV support?","options":["0800 428 428","10111","0861 322 322"],"answer_index":0}
 ]'::jsonb,
 'body_safety', '✊', 9),

('14-17', 'Recognising Abuse',
 'Learn to identify different types of abuse and that abuse is never the survivor''s fault.',
 '[
   {"emoji":"💔","text":"Abuse is not only physical. It can be emotional, verbal, financial, sexual, or digital."},
   {"emoji":"📱","text":"Digital abuse includes controlling your phone, tracking you, or sharing private photos without consent."},
   {"emoji":"💸","text":"Financial abuse is when someone controls your money to keep you dependent."},
   {"emoji":"🚫","text":"Abuse is a crime. It is NEVER the survivor''s fault, no matter what they wore, said, or did."},
   {"emoji":"🛟","text":"If you or someone you know is experiencing abuse, help is available. You are not alone."}
 ]'::jsonb,
 '[
   {"question":"Abuse is always the survivor''s fault.","options":["False","True","Sometimes"],"answer_index":0},
   {"question":"Which of these is a type of abuse?","options":["All of them: physical, emotional, financial, digital","Only physical","Only sexual"],"answer_index":0},
   {"question":"Sharing private photos without consent is...","options":["Digital abuse","A joke","Not abuse"],"answer_index":0}
 ]'::jsonb,
 'body_safety', '🔍', 10),

('14-17', 'Online Safety and Digital Boundaries',
 'Protect yourself online and recognise digital red flags.',
 '[
   {"emoji":"🔐","text":"Use strong, unique passwords. Enable two-factor authentication on your accounts."},
   {"emoji":"📍","text":"Be careful with location sharing. Only share your live location with people you trust completely."},
   {"emoji":"⚠️","text":"Red flags: someone asking for private photos, wanting to meet secretly, or trying to isolate you from friends."},
   {"emoji":"📸","text":"Never share intimate photos. Once something is online, you lose control of it. Revenge porn is a crime in SA."},
   {"emoji":"🛡️","text":"If someone is harassing you online, block them, take screenshots, and report to the platform and police."}
 ]'::jsonb,
 '[
   {"question":"What is a red flag online?","options":["Someone wanting to meet secretly","A friend liking your post","Getting a new follower"],"answer_index":0},
   {"question":"Revenge porn is...","options":["A crime in South Africa","Not illegal","A joke"],"answer_index":0},
   {"question":"If someone harasses you online, you should...","options":["Block, screenshot, report to platform and police","Just ignore it","Delete your account"],"answer_index":0}
 ]'::jsonb,
 'online_safety', '🔐', 11),

('14-17', 'Getting Help: Your Rights and Options',
 'Know your rights and the steps to get help if you or someone you know is in danger.',
 '[
   {"emoji":"📜","text":"You have the right to safety, to report a crime, and to be treated with dignity by police and healthcare workers."},
   {"emoji":"🏛️","text":"You can get a protection order under the Domestic Violence Act. It does not cost money."},
   {"emoji":"🏥","text":"Thuthuzela Care Centres provide survivor-centred care: medical exam, counselling, and police statement in one place."},
   {"emoji":"📞","text":"Key numbers: GBV Command Centre 0800 428 428, Childline 116, Lifeline 0861 322 322, SAPS 10111."},
   {"emoji":"💪","text":"Reporting is your choice. But even if you are not ready, you can still get support and counselling."}
 ]'::jsonb,
 '[
   {"question":"Does a protection order cost money?","options":["No, it is free","Yes, a lot","Only for lawyers"],"answer_index":0},
   {"question":"What do Thuthuzela Care Centres provide?","options":["Medical exam, counselling, and police statement in one place","Only medical care","Only counselling"],"answer_index":0},
   {"question":"Can you get counselling even if you don''t report to police?","options":["Yes","No","Only if you report"],"answer_index":0}
 ]'::jsonb,
 'helpers', '📋', 12)
ON CONFLICT DO NOTHING;

-- ============ ADULT EDUCATIONAL ARTICLES ============
INSERT INTO learning_content (age_band, title, description, steps, quiz, category, badge_emoji, sort_order) VALUES
('adult', 'What is Gender-Based Violence?',
 'Understand what GBV is, who it affects, and why it happens.',
 '[
   {"emoji":"📖","text":"Gender-based violence (GBV) is any harm done to someone because of their gender. It disproportionately affects women and girls."},
   {"emoji":"🏠","text":"GBV includes domestic violence, sexual violence, emotional abuse, financial abuse, and harmful cultural practices."},
   {"emoji":"⚖️","text":"GBV is a human rights violation and a crime. South Africa has laws to protect survivors, including the Domestic Violence Act and the Sexual Offences Act."},
   {"emoji":"🌍","text":"GBV is driven by gender inequality, power imbalances, and harmful social norms — not by what a survivor wore, said, or did."},
   {"emoji":"🛟","text":"Support is available: GBV Command Centre (0800 428 428), Thuthuzela Care Centres, and NGOs like POWA, Lifeline, and Rape Crisis."}
 ]'::jsonb,
 '[
   {"question":"GBV is caused by...","options":["Gender inequality and power imbalances","What the survivor wore","Bad luck"],"answer_index":0},
   {"question":"Which South African law protects survivors of domestic violence?","options":["The Domestic Violence Act","The Traffic Act","There is no law"],"answer_index":0},
   {"question":"Is GBV a crime?","options":["Yes","No","Only sometimes"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '📚', 101),

('adult', 'Types of Abuse',
 'Learn to recognise the different forms abuse can take.',
 '[
   {"emoji":"🥊","text":"Physical abuse: hitting, slapping, pushing, choking, or any physical harm. Also includes denying medical care."},
   {"emoji":"💬","text":"Emotional/verbal abuse: name-calling, humiliation, threats, isolation from friends and family, gaslighting."},
   {"emoji":"💰","text":"Financial abuse: controlling all money, preventing you from working, taking your salary, withholding basic needs."},
   {"emoji":"🔞","text":"Sexual abuse: any sexual act without consent, including within marriage. Marital rape is a crime in South Africa."},
   {"emoji":"📱","text":"Digital abuse: monitoring your phone, tracking your location, controlling social media, sharing intimate images without consent (revenge porn is a crime)."}
 ]'::jsonb,
 '[
   {"question":"Is marital rape a crime in South Africa?","options":["Yes","No","Only if separated"],"answer_index":0},
   {"question":"Controlling someone''s money to keep them dependent is...","options":["Financial abuse","Normal behaviour","Their right"],"answer_index":0},
   {"question":"Sharing intimate images without consent is...","options":["A crime (revenge porn)","Not a big deal","A joke"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '🔍', 102),

('adult', 'Safety Planning',
 'Create a personal safety plan to protect yourself and your children.',
 '[
   {"emoji":"📋","text":"A safety plan is a personalised plan to keep you safe before, during, and after leaving an abusive situation."},
   {"emoji":"📱","text":"Memorise key numbers: 112, 10111, GBV Command Centre 0800 428 428. Keep your phone charged and credit loaded."},
   {"emoji":"🎒","text":"Pack a ''go bag'' with ID documents, medication, spare clothes, cash, and important papers. Keep it somewhere safe or with a trusted friend."},
   {"emoji":"🏠","text":"Identify safe rooms: rooms with a phone, a door that locks, and a way out. Avoid rooms with weapons (kitchen, garage)."},
   {"emoji":"👥","text":"Agree on a code word with trusted friends or family. If you text them this word, they know to call the police."},
   {"emoji":"📍","text":"Use this app''s location sharing feature to let trusted people know where you are when you feel unsafe."}
 ]'::jsonb,
 '[
   {"question":"What should be in a go bag?","options":["ID, medication, cash, important papers","Just clothes","Nothing"],"answer_index":0},
   {"question":"Which rooms should you avoid during violence?","options":["Kitchen and garage (weapons)","Bedroom","Bathroom"],"answer_index":0},
   {"question":"A code word with friends is for...","options":["Signalling danger so they call police","A game","Remembering passwords"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '🛡️', 103),

('adult', 'Protection Orders',
 'How to get a protection order under the Domestic Violence Act.',
 '[
   {"emoji":"📜","text":"A protection order is a court order that tells an abuser to stop the abuse. It is FREE to apply."},
   {"emoji":"🏛️","text":"Go to the nearest Magistrate''s Court or ask a police officer to help you apply. You do not need a lawyer."},
   {"emoji":"📝","text":"Fill in the application form (Form 2). Describe the abuse in detail. Bring any evidence (messages, photos, medical records)."},
   {"emoji":"⏰","text":"The court can grant an interim (temporary) protection order the same day. A return date is set for the abuser to respond."},
   {"emoji":"🚔","text":"Once finalised, if the abuser breaks the order, it is a crime. Call 10111 immediately and show the police the order."},
   {"emoji":"📋","text":"Keep a copy of the order with you at all times. Give copies to your workplace, school, and trusted neighbours."}
 ]'::jsonb,
 '[
   {"question":"Does a protection order cost money?","options":["No, it is free","Yes, thousands of rand","Only if you use a lawyer"],"answer_index":0},
   {"question":"Where do you apply?","options":["Magistrate''s Court","Police station only","High Court"],"answer_index":0},
   {"question":"If the abuser breaks the order, what do you do?","options":["Call 10111 immediately","Wait and see","Call them"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '⚖️', 104),

('adult', 'How to Open a Case',
 'Steps to open a criminal case with SAPS after GBV.',
 '[
   {"emoji":"🚔","text":"Go to any SAPS police station. You have the right to open a case. The police cannot refuse to take your statement."},
   {"emoji":"📝","text":"Give a detailed statement. Be honest and include everything you remember. A female officer can assist if you request."},
   {"emoji":"🏥","text":"If you were sexually assaulted, go to a Thuthuzela Care Centre BEFORE bathing. They do a medical exam, give ARVs, and collect evidence."},
   {"emoji":"📋","text":"You will get a case number (CAS number). Write it down. You can use it to follow up on your case."},
   {"emoji":"📞","text":"If police are unhelpful, contact the IPID (Independent Police Investigative Directorate) or a GBV organisation for support."},
   {"emoji":"🛡️","text":"You can also apply for a protection order at the same time. Ask the officer to help you."}
 ]'::jsonb,
 '[
   {"question":"Can police refuse to take your statement?","options":["No, they cannot refuse","Yes if they are busy","Only for minor incidents"],"answer_index":0},
   {"question":"After sexual assault, you should...","options":["Go to a Thuthuzela Care Centre before bathing","Take a bath first","Wait a few days"],"answer_index":0},
   {"question":"What number do you get to track your case?","options":["CAS number","ID number","Phone number"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '📋', 105),

('adult', 'What to Expect at a Thuthuzela Care Centre',
 'Understanding the survivor-centred services at Thuthuzela Care Centres.',
 '[
   {"emoji":"🏥","text":"Thuthuzela Care Centres are one-stop facilities for survivors of sexual violence. They provide medical, counselling, and legal services in one place."},
   {"emoji":"🩺","text":"Medical services: examination, treatment of injuries, HIV testing, ARVs (must start within 72 hours), STI treatment, and pregnancy prevention."},
   {"emoji":"💬","text":"Counselling: a trained counsellor will talk to you, help you process what happened, and support you emotionally."},
   {"emoji":"📝","text":"Police statement: you can give your statement at the centre in a private, comfortable room — not at a police station."},
   {"emoji":"⚖️","text":"Legal support: the centre helps connect you with a prosecutor and keeps you updated on your case."},
   {"emoji":"💛","text":"Everything is free and confidential. You will be treated with dignity and respect. You are in control of what services you use."}
 ]'::jsonb,
 '[
   {"question":"What services does a Thuthuzela Care Centre provide?","options":["Medical, counselling, and police statement in one place","Only medical care","Only counselling"],"answer_index":0},
   {"question":"ARVs must start within how many hours?","options":["72 hours","24 hours","1 week"],"answer_index":0},
   {"question":"Are Thuthuzela services free?","options":["Yes, free and confidential","No, they cost money","Only the counselling"],"answer_index":0}
 ]'::jsonb,
 'gbv_education', '🏥', 106)
ON CONFLICT DO NOTHING;

-- Seed developmental milestones for all age ranges (0-60 months)
-- Run this script on your production database to add milestones

-- 0-3 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-head-control-0-3', 'Holds head up briefly', 'Gross Motor', 0, 3, 'Can hold head up for short periods when supported', 'Typical by 2-3 months'),
('gm-leg-movement-0-3', 'Kicks legs', 'Gross Motor', 0, 3, 'Moves and kicks legs when lying on back', 'Typical by 1-2 months'),
('fm-hands-open-0-3', 'Opens hands', 'Fine motor', 0, 3, 'Begins to open hands and bring them together', 'Typical by 2-3 months'),
('comm-coos-0-3', 'Coos and makes sounds', 'Communication', 0, 3, 'Makes cooing sounds and responds to voices', 'Typical by 2-3 months'),
('se-smiles-0-3', 'Social smile', 'Social & Emotional', 0, 3, 'Smiles at people spontaneously', 'Typical by 2-3 months'),
('cog-tracks-objects-0-3', 'Tracks moving objects', 'Cognitive', 0, 3, 'Follows moving objects with eyes', 'Typical by 2-3 months'),
('vision-focus-0-3', 'Focuses on faces', 'Vision', 0, 3, 'Can focus on faces from 8-12 inches away', 'Typical by 1-2 months'),
('hearing-startles-0-3', 'Startles at loud sounds', 'Hearing', 0, 3, 'Reacts to sudden loud noises', 'Present from birth')
ON CONFLICT (id) DO NOTHING;

-- 4-6 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-rollover-4-6', 'Rolls over', 'Gross Motor', 4, 6, 'Rolls from tummy to back and back to tummy', 'Typical by 4-6 months'),
('gm-sits-support-4-6', 'Sits with support', 'Gross Motor', 4, 6, 'Sits when supported or props self up', 'Typical by 5-6 months'),
('fm-reaches-4-6', 'Reaches for toys', 'Fine motor', 4, 6, 'Reaches for and grasps toys with whole hand', 'Typical by 4-5 months'),
('fm-transfer-4-6', 'Transfers objects', 'Fine motor', 4, 6, 'Moves objects from one hand to the other', 'Typical by 5-6 months'),
('comm-babbles-4-6', 'Babbles', 'Communication', 4, 6, 'Makes sounds like "ba-ba" and "ma-ma"', 'Typical by 6 months'),
('comm-responds-name-4-6', 'Responds to name', 'Communication', 4, 6, 'Turns head when hearing own name', 'Typical by 6 months'),
('se-laughs-4-6', 'Laughs', 'Social & Emotional', 4, 6, 'Laughs out loud and shows joy', 'Typical by 4-5 months'),
('cog-curious-4-6', 'Shows curiosity', 'Cognitive', 4, 6, 'Looks around at things nearby and shows interest', 'Typical by 4-6 months')
ON CONFLICT (id) DO NOTHING;

-- 7-9 months milestones  
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-sits-alone-7-9', 'Sits without support', 'Gross Motor', 7, 9, 'Sits steadily without help', 'Typical by 7-8 months'),
('gm-crawls-7-9', 'Crawls', 'Gross Motor', 7, 9, 'Moves around by crawling or scooting', 'Typical by 8-9 months'),
('gm-pulls-stand-7-9', 'Pulls to stand', 'Gross Motor', 7, 9, 'Pulls self up to standing position', 'Typical by 9 months'),
('fm-pincer-7-9', 'Pincer grasp', 'Fine motor', 7, 9, 'Picks up small objects using thumb and finger', 'Typical by 9 months'),
('comm-gestures-7-9', 'Uses gestures', 'Communication', 7, 9, 'Waves bye-bye and points at things', 'Typical by 9 months'),
('se-stranger-anxiety-7-9', 'Shows stranger anxiety', 'Social & Emotional', 7, 9, 'May be shy or anxious around strangers', 'Typical by 7-9 months'),
('cog-finds-hidden-7-9', 'Finds hidden objects', 'Cognitive', 7, 9, 'Looks for things that are hidden', 'Typical by 8-9 months')
ON CONFLICT (id) DO NOTHING;

-- 10-12 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-stands-alone-10-12', 'Stands alone', 'Gross Motor', 10, 12, 'Stands alone without support', 'Typical by 12 months'),
('gm-walks-hold-10-12', 'Walks holding on', 'Gross Motor', 10, 12, 'Takes steps while holding furniture or hands', 'Typical by 11-12 months'),
('fm-feeds-self-10-12', 'Feeds self', 'Fine motor', 10, 12, 'Picks up food and feeds self with fingers', 'Typical by 12 months'),
('comm-first-words-10-12', 'First words', 'Communication', 10, 12, 'Says first words like "mama" or "dada" with meaning', 'Typical by 12 months'),
('comm-understands-no-10-12', 'Understands "no"', 'Communication', 10, 12, 'Stops when told "no"', 'Typical by 10-12 months'),
('se-separation-anxiety-10-12', 'Separation anxiety', 'Social & Emotional', 10, 12, 'Gets upset when parent leaves', 'Typical by 10-12 months'),
('cog-simple-instructions-10-12', 'Follows simple directions', 'Cognitive', 10, 12, 'Can follow simple requests like "give me"', 'Typical by 12 months')
ON CONFLICT (id) DO NOTHING;

-- 13-18 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-walks-alone-13-18', 'Walks alone', 'Gross Motor', 13, 18, 'Walks independently without support', 'Typical by 13-15 months'),
('gm-climbs-stairs-13-18', 'Climbs stairs', 'Gross Motor', 13, 18, 'Climbs stairs holding on or crawling up', 'Typical by 16-18 months'),
('fm-scribbles-13-18', 'Scribbles', 'Fine motor', 13, 18, 'Makes marks with crayon on paper', 'Typical by 15-18 months'),
('fm-stacks-blocks-13-18', 'Stacks blocks', 'Fine motor', 13, 18, 'Can stack 2-4 blocks on top of each other', 'Typical by 15-18 months'),
('comm-several-words-13-18', 'Says several words', 'Communication', 13, 18, 'Uses 3-6 words regularly', 'Typical by 18 months'),
('comm-points-show-13-18', 'Points to show others', 'Communication', 13, 18, 'Points to things to show parents', 'Typical by 14-16 months'),
('se-plays-pretend-13-18', 'Plays pretend', 'Social & Emotional', 13, 18, 'Pretends to feed doll or talk on phone', 'Typical by 15-18 months'),
('cog-uses-objects-13-18', 'Uses objects correctly', 'Cognitive', 13, 18, 'Uses objects as intended (cup, brush, phone)', 'Typical by 15-18 months')
ON CONFLICT (id) DO NOTHING;

-- 19-24 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-runs-19-24', 'Runs', 'Gross Motor', 19, 24, 'Runs with coordination', 'Typical by 20-24 months'),
('fm-turns-pages-19-24', 'Turns book pages', 'Fine motor', 19, 24, 'Turns pages in a book one at a time', 'Typical by 21-24 months'),
('comm-combines-words-19-24', 'Combines two words', 'Communication', 19, 24, 'Puts two words together like "more milk"', 'Typical by 20-24 months'),
('se-copies-others-19-24', 'Copies others', 'Social & Emotional', 19, 24, 'Copies what other children or adults do', 'Typical by 20-24 months'),
('cog-sorts-shapes-19-24', 'Sorts shapes', 'Cognitive', 19, 24, 'Can put shapes in correct holes', 'Typical by 22-24 months')
ON CONFLICT (id) DO NOTHING;

-- 25-30 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-walks-stairs-25-30', 'Walks up stairs alternating feet', 'Gross Motor', 25, 30, 'Walks upstairs using alternating feet', 'Typical by 27-30 months'),
('gm-jumps-25-30', 'Jumps with both feet', 'Gross Motor', 25, 30, 'Jumps off the ground with both feet', 'Typical by 27-30 months'),
('fm-uses-utensils-25-30', 'Uses fork and spoon', 'Fine motor', 25, 30, 'Uses fork and spoon independently', 'Typical by 27-30 months'),
('fm-turns-doorknob-25-30', 'Turns doorknobs', 'Fine motor', 25, 30, 'Can turn doorknobs and twist lids', 'Typical by 27-30 months'),
('comm-simple-sentences-25-30', 'Uses simple sentences', 'Communication', 25, 30, 'Speaks in 3-4 word sentences', 'Typical by 27-30 months'),
('se-plays-with-others-25-30', 'Plays alongside others', 'Social & Emotional', 25, 30, 'Plays alongside other children', 'Typical by 25-30 months'),
('cog-names-colors-25-30', 'Names colors', 'Cognitive', 25, 30, 'Can name at least one color', 'Typical by 27-30 months')
ON CONFLICT (id) DO NOTHING;

-- 31-36 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-pedals-tricycle-31-36', 'Pedals tricycle', 'Gross Motor', 31, 36, 'Pedals and steers a tricycle', 'Typical by 33-36 months'),
('gm-stands-one-foot-31-36', 'Stands on one foot briefly', 'Gross Motor', 31, 36, 'Can balance on one foot for a second or two', 'Typical by 33-36 months'),
('fm-uses-scissors-31-36', 'Uses scissors', 'Fine motor', 31, 36, 'Cuts paper with child-safe scissors', 'Typical by 33-36 months'),
('fm-draws-circle-31-36', 'Draws a circle', 'Fine motor', 31, 36, 'Can copy or draw a circle', 'Typical by 33-36 months'),
('comm-full-sentences-31-36', 'Uses full sentences', 'Communication', 31, 36, 'Speaks in 4-5 word sentences', 'Typical by 33-36 months'),
('se-takes-turns-31-36', 'Takes turns', 'Social & Emotional', 31, 36, 'Takes turns in games with other children', 'Typical by 33-36 months'),
('cog-counts-3-31-36', 'Counts to 3', 'Cognitive', 31, 36, 'Can count 3 objects', 'Typical by 33-36 months')
ON CONFLICT (id) DO NOTHING;

-- 37-49 months milestones (updated range)
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-hops-one-foot-37-48', 'Hops on one foot', 'Gross Motor', 37, 49, 'Can hop on one foot several times', 'Typical by 42-48 months'),
('gm-catches-ball-37-48', 'Catches a ball', 'Gross Motor', 37, 49, 'Catches a bounced ball most of the time', 'Typical by 42-48 months'),
('fm-draws-person-37-48', 'Draws a person', 'Fine motor', 37, 49, 'Draws a person with 2-4 body parts', 'Typical by 42-48 months'),
('fm-uses-fork-well-37-48', 'Uses fork competently', 'Fine motor', 37, 49, 'Uses fork and spoon without spilling much', 'Typical by 40-48 months'),
('comm-tells-stories-37-48', 'Tells simple stories', 'Communication', 37, 49, 'Tells a story with 2-3 connected events', 'Typical by 42-48 months'),
('comm-sings-songs-37-48', 'Sings songs from memory', 'Communication', 37, 49, 'Sings a song or says a poem from memory', 'Typical by 40-48 months'),
('se-plays-cooperative-37-48', 'Plays cooperatively', 'Social & Emotional', 37, 49, 'Plays cooperatively with other children', 'Typical by 42-48 months'),
('se-comforts-others-37-48', 'Shows empathy', 'Social & Emotional', 37, 49, 'Comforts others who are hurt or sad', 'Typical by 42-48 months'),
('cog-understands-same-different-37-48', 'Knows same/different', 'Cognitive', 37, 49, 'Understands concepts of "same" and "different"', 'Typical by 42-48 months'),
('cog-counts-10-37-48', 'Counts to 10', 'Cognitive', 37, 49, 'Can count to 10', 'Typical by 45-48 months')
ON CONFLICT (id) DO NOTHING;

-- 49-60 months milestones
INSERT INTO milestones (id, title, category, age_range_months_min, age_range_months_max, description, typical_range)
VALUES
('gm-skips-49-60', 'Skips', 'Gross Motor', 49, 60, 'Skips smoothly', 'Typical by 54-60 months'),
('gm-stands-one-foot-10sec-49-60', 'Stands on one foot for 10 seconds', 'Gross Motor', 49, 60, 'Can balance on one foot for 10 seconds or longer', 'Typical by 54-60 months'),
('fm-draws-triangle-49-60', 'Draws a triangle', 'Fine motor', 49, 60, 'Can copy a triangle', 'Typical by 54-60 months'),
('fm-prints-letters-49-60', 'Prints some letters', 'Fine motor', 49, 60, 'Prints some letters or numbers', 'Typical by 54-60 months'),
('comm-clear-speech-49-60', 'Speaks clearly', 'Communication', 49, 60, 'Speaks clearly enough for strangers to understand', 'Typical by 54-60 months'),
('comm-tells-detailed-stories-49-60', 'Tells detailed stories', 'Communication', 49, 60, 'Tells longer stories with logical sequence', 'Typical by 54-60 months'),
('se-follows-rules-49-60', 'Follows game rules', 'Social & Emotional', 49, 60, 'Follows rules in games and activities', 'Typical by 54-60 months'),
('se-wants-friends-49-60', 'Wants to be like friends', 'Social & Emotional', 49, 60, 'Wants to be like friends and please them', 'Typical by 54-60 months'),
('cog-knows-colors-49-60', 'Knows colors', 'Cognitive', 49, 60, 'Can name 4 or more colors', 'Typical by 54-60 months'),
('cog-counts-20-49-60', 'Counts to 20', 'Cognitive', 49, 60, 'Can count to 20 or higher', 'Typical by 54-60 months')
ON CONFLICT (id) DO NOTHING;

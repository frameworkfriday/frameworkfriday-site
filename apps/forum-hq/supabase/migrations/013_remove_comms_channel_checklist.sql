-- Remove "Join the group communication channel" onboarding item
-- Communication now happens through Forum HQ directly — no external platform needed.

-- Delete any progress records for this item first (FK constraint)
delete from onboarding_progress
where item_id in (
  select id from onboarding_items where title = 'Join the group communication channel'
);

-- Delete the item itself
delete from onboarding_items
where title = 'Join the group communication channel';

-- Re-number positions so there's no gap (items that were 3-9 become 2-8)
update onboarding_items set position = position - 1
where position > 2;

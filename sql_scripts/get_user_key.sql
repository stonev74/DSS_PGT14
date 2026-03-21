
CREATE FUNCTION get_user_key ()  RETURNS text
  STABLE
AS $body$
select key from keys where  keyname='user'
    limit 1
$body$ LANGUAGE sql
/

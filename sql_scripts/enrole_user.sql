

create or replace function enrole_user(
    username_new text,
    password_new text, 
    role text
) returns text as $$
declare
    username_crypt bytea;
    password_crypt bytea;
        key text;
        quote text := chr(39); 
     

begin
    -- Check for dodgy characters in the username
    if regexp_match(username_new, '[^a-zA-Z0-9_]') is not null then
        return 'Invalid characters in username';
    end if;
    -- Check for dodgy characters in the password
    if regexp_match(password_new, '[^a-zA-Z0-9_!@#$%^&*()£]') is not null then
        return 'Invalid characters in password';
    end if;
    -- Check if the user already exists
     key := get_user_key();
    if exists ( select 1  from users where pgp_sym_decrypt(username_en, key) = username_new ) 
    then
         return 'User Already Exists';
    end if;
    key := get_user_key();
   username_crypt := pgp_sym_encrypt(username_new, key);
    password_crypt := pgp_sym_encrypt(password_new, key);  
    insert into users (username_en, password_en, role) values (username_crypt, password_crypt, role);
     
    return 'OK';   
end $$ language plpgsql;


    
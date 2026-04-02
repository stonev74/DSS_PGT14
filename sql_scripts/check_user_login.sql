
CREATE FUNCTION check_user_login (username text, pword text, machine text, ip4_addr text)  RETURNS integer
  VOLATILE
AS $body$
DECLARE 

userkey text ; 

count integer ;
allowed integer :=0;
quote text ;
BEGIN
     quote := chr(39);
     allowed := allowed + regexp_count( username, quote ) *10;
     allowed := allowed  + regexp_count( username, '--' ) *10 ;
     allowed := allowed  + regexp_count( pword, quote)*100  ;
  allowed := allowed  + regexp_count( pword, '--' )  *100  ;
     userkey := get_user_key();
     IF  allowed > 0
       THEN
         return allowed ;
    END IF;  
       
    select count(1) into count from users where 
    pgp_sym_decrypt (username_en, userkey)  = username
    and pgp_sym_decrypt (password_en, userkey)  = pword ;
    allowed  :=  allowed+  1 - count ;
    if allowed = 0 
    then
          insert into login_history ( username_en, machine, ip4_addr) values
            (pgp_sym_encrypt ( username, userkey), machine, ip4_addr) ;
    end if ;        
    return allowed  ;
END;
$body$ LANGUAGE plpgsql
/

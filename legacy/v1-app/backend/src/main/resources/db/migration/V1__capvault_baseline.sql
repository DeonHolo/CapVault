create table if not exists capvault_schema_marker (
    id integer primary key,
    description varchar(255) not null
);

insert into capvault_schema_marker (id, description)
values (1, 'CapVault baseline schema managed by JPA with Flyway history enabled')
on conflict (id) do nothing;

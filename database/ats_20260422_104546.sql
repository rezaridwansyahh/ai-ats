--
-- PostgreSQL database dump
--

\restrict F7Vsm7XAgDcCGaYxrcrsbI6EgNByET3cduXl9WljwZpe3mabObbiebPmN7ZSFXq

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: booking_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status_type AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.booking_status_type OWNER TO postgres;

--
-- Name: candidate_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.candidate_status_type AS ENUM (
    'Kotak masuk',
    'Prescreen',
    'Terpilih',
    'Wawancara',
    'Penawaran',
    'Menerima Tawaran',
    'Tidak cocok'
);


ALTER TYPE public.candidate_status_type OWNER TO postgres;

--
-- Name: condition_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.condition_type AS ENUM (
    'Connected',
    'Not Connected',
    'Error'
);


ALTER TYPE public.condition_type OWNER TO postgres;

--
-- Name: currency_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.currency_type AS ENUM (
    'AUD',
    'HKD',
    'IDR',
    'MYR',
    'NZD',
    'PHP',
    'SGD',
    'THB',
    'USD'
);


ALTER TYPE public.currency_type OWNER TO postgres;

--
-- Name: pay_display_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pay_display_type AS ENUM (
    'Show',
    'Hide'
);


ALTER TYPE public.pay_display_type OWNER TO postgres;

--
-- Name: pay_type_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pay_type_type AS ENUM (
    'Hourly',
    'Monthly',
    'Annually'
);


ALTER TYPE public.pay_type_type OWNER TO postgres;

--
-- Name: platform_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_type AS ENUM (
    'linkedin',
    'seek',
    'glints',
    'instagram',
    'facebook',
    'whatsapp'
);


ALTER TYPE public.platform_type OWNER TO postgres;

--
-- Name: recruiter_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recruiter_status_type AS ENUM (
    'Active',
    'Onboarding'
);


ALTER TYPE public.recruiter_status_type OWNER TO postgres;

--
-- Name: session_slot_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_slot_type AS ENUM (
    '10-12',
    '1-3',
    '4-6'
);


ALTER TYPE public.session_slot_type OWNER TO postgres;

--
-- Name: status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_type AS ENUM (
    'Draft',
    'Active',
    'Running',
    'Expired',
    'Failed',
    'Blocked'
);


ALTER TYPE public.status_type OWNER TO postgres;

--
-- Name: work_option_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.work_option_type AS ENUM (
    'On-site',
    'Hybrid',
    'Remote'
);


ALTER TYPE public.work_option_type OWNER TO postgres;

--
-- Name: work_type_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.work_type_type AS ENUM (
    'Full-time',
    'Part-time',
    'Contract',
    'Casual'
);


ALTER TYPE public.work_type_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cookies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cookies (
    id integer NOT NULL,
    account_id integer NOT NULL,
    cookies jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cookies OWNER TO postgres;

--
-- Name: cookies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cookies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cookies_id_seq OWNER TO postgres;

--
-- Name: cookies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cookies_id_seq OWNED BY public.cookies.id;


--
-- Name: core_job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.core_job (
    id integer NOT NULL,
    job_title character varying(255) NOT NULL,
    job_desc text,
    job_location character varying(255),
    work_option public.work_option_type,
    work_type public.work_type_type,
    pay_type public.pay_type_type,
    currency public.currency_type,
    pay_min integer,
    pay_max integer,
    pay_display public.pay_display_type,
    company character varying(255),
    seniority_level character varying(255),
    company_url character varying(255),
    qualifications text,
    required_skills jsonb,
    preferred_skills jsonb,
    status public.status_type DEFAULT 'Draft'::public.status_type NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.core_job OWNER TO postgres;

--
-- Name: core_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.core_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_job_id_seq OWNER TO postgres;

--
-- Name: core_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.core_job_id_seq OWNED BY public.core_job.id;


--
-- Name: core_job_sourcing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.core_job_sourcing (
    id integer NOT NULL,
    account_id integer NOT NULL,
    platform public.platform_type NOT NULL,
    platform_job_id character varying(255),
    status public.status_type DEFAULT 'Active'::public.status_type NOT NULL,
    last_sync timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    additional jsonb
);


ALTER TABLE public.core_job_sourcing OWNER TO postgres;

--
-- Name: core_job_sourcing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.core_job_sourcing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_job_sourcing_id_seq OWNER TO postgres;

--
-- Name: core_job_sourcing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.core_job_sourcing_id_seq OWNED BY public.core_job_sourcing.id;


--
-- Name: core_project_linkedin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.core_project_linkedin (
    id integer NOT NULL,
    project_id integer,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    job_title character varying(255) NOT NULL,
    job_location character varying(255) NOT NULL,
    seniority_level character varying(255) NOT NULL,
    company_for character varying(255) NOT NULL,
    project_visible character varying(255)
);


ALTER TABLE public.core_project_linkedin OWNER TO postgres;

--
-- Name: core_project_linkedin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.core_project_linkedin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_project_linkedin_id_seq OWNER TO postgres;

--
-- Name: core_project_linkedin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.core_project_linkedin_id_seq OWNED BY public.core_project_linkedin.id;


--
-- Name: global_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_permissions (
    id integer NOT NULL,
    module_menu_id integer NOT NULL,
    functionality character varying(100) NOT NULL
);


ALTER TABLE public.global_permissions OWNER TO postgres;

--
-- Name: global_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.global_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.global_permissions_id_seq OWNER TO postgres;

--
-- Name: global_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.global_permissions_id_seq OWNED BY public.global_permissions.id;


--
-- Name: mapping_candidates_linkedin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_candidates_linkedin (
    id integer NOT NULL,
    candidate_id integer NOT NULL
);


ALTER TABLE public.mapping_candidates_linkedin OWNER TO postgres;

--
-- Name: mapping_candidates_linkedin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_candidates_linkedin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_candidates_linkedin_id_seq OWNER TO postgres;

--
-- Name: mapping_candidates_linkedin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_candidates_linkedin_id_seq OWNED BY public.mapping_candidates_linkedin.id;


--
-- Name: mapping_candidates_seek; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_candidates_seek (
    id integer NOT NULL,
    candidate_id integer NOT NULL,
    candidate_status public.candidate_status_type NOT NULL,
    candidate_seek_id integer NOT NULL
);


ALTER TABLE public.mapping_candidates_seek OWNER TO postgres;

--
-- Name: mapping_candidates_seek_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_candidates_seek_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_candidates_seek_id_seq OWNER TO postgres;

--
-- Name: mapping_candidates_seek_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_candidates_seek_id_seq OWNED BY public.mapping_candidates_seek.id;


--
-- Name: mapping_job_sourcing_linkedin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_job_sourcing_linkedin (
    id integer NOT NULL,
    job_sourcing_id integer NOT NULL,
    project_id integer,
    linkedin_id character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mapping_job_sourcing_linkedin OWNER TO postgres;

--
-- Name: mapping_job_sourcing_linkedin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_job_sourcing_linkedin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_job_sourcing_linkedin_id_seq OWNER TO postgres;

--
-- Name: mapping_job_sourcing_linkedin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_job_sourcing_linkedin_id_seq OWNED BY public.mapping_job_sourcing_linkedin.id;


--
-- Name: mapping_job_sourcing_seek; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_job_sourcing_seek (
    id integer NOT NULL,
    job_sourcing_id integer NOT NULL,
    seek_id character varying(100),
    currency public.currency_type,
    pay_type public.pay_type_type,
    created_date_seek character varying(255),
    created_by character varying(255),
    candidate_count integer DEFAULT 0,
    pay_min integer,
    pay_max integer,
    pay_display public.pay_display_type,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mapping_job_sourcing_seek OWNER TO postgres;

--
-- Name: mapping_job_sourcing_seek_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_job_sourcing_seek_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_job_sourcing_seek_id_seq OWNER TO postgres;

--
-- Name: mapping_job_sourcing_seek_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_job_sourcing_seek_id_seq OWNED BY public.mapping_job_sourcing_seek.id;


--
-- Name: mapping_modules_menus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_modules_menus (
    id integer NOT NULL,
    module_id integer NOT NULL,
    menu_id integer NOT NULL
);


ALTER TABLE public.mapping_modules_menus OWNER TO postgres;

--
-- Name: mapping_modules_menus_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_modules_menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_modules_menus_id_seq OWNER TO postgres;

--
-- Name: mapping_modules_menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_modules_menus_id_seq OWNED BY public.mapping_modules_menus.id;


--
-- Name: mapping_roles_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_roles_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.mapping_roles_permissions OWNER TO postgres;

--
-- Name: mapping_roles_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_roles_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_roles_permissions_id_seq OWNER TO postgres;

--
-- Name: mapping_roles_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_roles_permissions_id_seq OWNED BY public.mapping_roles_permissions.id;


--
-- Name: mapping_users_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mapping_users_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.mapping_users_roles OWNER TO postgres;

--
-- Name: mapping_users_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mapping_users_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mapping_users_roles_id_seq OWNER TO postgres;

--
-- Name: mapping_users_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mapping_users_roles_id_seq OWNED BY public.mapping_users_roles.id;


--
-- Name: master_candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_candidates (
    id integer NOT NULL,
    job_id integer NOT NULL,
    name character varying(255) NOT NULL,
    last_position character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    education character varying(255),
    information jsonb,
    date timestamp with time zone,
    attachment character varying(255)
);


ALTER TABLE public.master_candidates OWNER TO postgres;

--
-- Name: master_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_candidates_id_seq OWNER TO postgres;

--
-- Name: master_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_candidates_id_seq OWNED BY public.master_candidates.id;


--
-- Name: master_job_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_job_account (
    id integer NOT NULL,
    portal_name public.platform_type NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    user_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    condition public.condition_type DEFAULT 'Not Connected'::public.condition_type NOT NULL,
    last_sync timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.master_job_account OWNER TO postgres;

--
-- Name: master_job_account_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_job_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_job_account_id_seq OWNER TO postgres;

--
-- Name: master_job_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_job_account_id_seq OWNED BY public.master_job_account.id;


--
-- Name: master_menus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_menus (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.master_menus OWNER TO postgres;

--
-- Name: master_menus_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_menus_id_seq OWNER TO postgres;

--
-- Name: master_menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_menus_id_seq OWNED BY public.master_menus.id;


--
-- Name: master_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_modules (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.master_modules OWNER TO postgres;

--
-- Name: master_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_modules_id_seq OWNER TO postgres;

--
-- Name: master_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_modules_id_seq OWNED BY public.master_modules.id;


--
-- Name: master_recruiters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_recruiters (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    jobs_assigned integer DEFAULT 0 NOT NULL,
    status public.recruiter_status_type DEFAULT 'Active'::public.recruiter_status_type NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.master_recruiters OWNER TO postgres;

--
-- Name: master_recruiters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_recruiters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_recruiters_id_seq OWNER TO postgres;

--
-- Name: master_recruiters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_recruiters_id_seq OWNED BY public.master_recruiters.id;


--
-- Name: master_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    additional jsonb
);


ALTER TABLE public.master_roles OWNER TO postgres;

--
-- Name: master_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_roles_id_seq OWNER TO postgres;

--
-- Name: master_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_roles_id_seq OWNED BY public.master_roles.id;


--
-- Name: master_sourcing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_sourcing (
    id integer NOT NULL,
    job_title character varying(255),
    location character varying(255),
    skill character varying(255),
    company character varying(255),
    school character varying(255),
    year_graduate integer,
    industry character varying(255),
    keyword character varying(255),
    CONSTRAINT at_least_one_field_filled CHECK (((job_title IS NOT NULL) OR (location IS NOT NULL) OR (skill IS NOT NULL) OR (company IS NOT NULL) OR (school IS NOT NULL) OR (year_graduate IS NOT NULL) OR (industry IS NOT NULL) OR (keyword IS NOT NULL)))
);


ALTER TABLE public.master_sourcing OWNER TO postgres;

--
-- Name: master_sourcing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_sourcing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_sourcing_id_seq OWNER TO postgres;

--
-- Name: master_sourcing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_sourcing_id_seq OWNED BY public.master_sourcing.id;


--
-- Name: master_sourcing_recruite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_sourcing_recruite (
    id integer NOT NULL,
    sourcing_id integer NOT NULL,
    name character varying(255) NOT NULL,
    skill character varying(255) NOT NULL,
    information jsonb,
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.master_sourcing_recruite OWNER TO postgres;

--
-- Name: master_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_users (
    id integer NOT NULL,
    password text NOT NULL,
    email character varying(100) NOT NULL,
    username character varying(100) NOT NULL
);


ALTER TABLE public.master_users OWNER TO postgres;

--
-- Name: master_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_users_id_seq OWNER TO postgres;

--
-- Name: master_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_users_id_seq OWNED BY public.master_users.id;


--
-- Name: cookies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cookies ALTER COLUMN id SET DEFAULT nextval('public.cookies_id_seq'::regclass);


--
-- Name: core_job id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job ALTER COLUMN id SET DEFAULT nextval('public.core_job_id_seq'::regclass);


--
-- Name: core_job_sourcing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job_sourcing ALTER COLUMN id SET DEFAULT nextval('public.core_job_sourcing_id_seq'::regclass);


--
-- Name: core_project_linkedin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_project_linkedin ALTER COLUMN id SET DEFAULT nextval('public.core_project_linkedin_id_seq'::regclass);


--
-- Name: global_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_permissions ALTER COLUMN id SET DEFAULT nextval('public.global_permissions_id_seq'::regclass);


--
-- Name: mapping_candidates_linkedin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_linkedin ALTER COLUMN id SET DEFAULT nextval('public.mapping_candidates_linkedin_id_seq'::regclass);


--
-- Name: mapping_candidates_seek id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_seek ALTER COLUMN id SET DEFAULT nextval('public.mapping_candidates_seek_id_seq'::regclass);


--
-- Name: mapping_job_sourcing_linkedin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin ALTER COLUMN id SET DEFAULT nextval('public.mapping_job_sourcing_linkedin_id_seq'::regclass);


--
-- Name: mapping_job_sourcing_seek id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_seek ALTER COLUMN id SET DEFAULT nextval('public.mapping_job_sourcing_seek_id_seq'::regclass);


--
-- Name: mapping_modules_menus id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_modules_menus ALTER COLUMN id SET DEFAULT nextval('public.mapping_modules_menus_id_seq'::regclass);


--
-- Name: mapping_roles_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_roles_permissions ALTER COLUMN id SET DEFAULT nextval('public.mapping_roles_permissions_id_seq'::regclass);


--
-- Name: mapping_users_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_users_roles ALTER COLUMN id SET DEFAULT nextval('public.mapping_users_roles_id_seq'::regclass);


--
-- Name: master_candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_candidates ALTER COLUMN id SET DEFAULT nextval('public.master_candidates_id_seq'::regclass);


--
-- Name: master_job_account id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_job_account ALTER COLUMN id SET DEFAULT nextval('public.master_job_account_id_seq'::regclass);


--
-- Name: master_menus id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_menus ALTER COLUMN id SET DEFAULT nextval('public.master_menus_id_seq'::regclass);


--
-- Name: master_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_modules ALTER COLUMN id SET DEFAULT nextval('public.master_modules_id_seq'::regclass);


--
-- Name: master_recruiters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_recruiters ALTER COLUMN id SET DEFAULT nextval('public.master_recruiters_id_seq'::regclass);


--
-- Name: master_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_roles ALTER COLUMN id SET DEFAULT nextval('public.master_roles_id_seq'::regclass);


--
-- Name: master_sourcing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sourcing ALTER COLUMN id SET DEFAULT nextval('public.master_sourcing_id_seq'::regclass);


--
-- Name: master_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_users ALTER COLUMN id SET DEFAULT nextval('public.master_users_id_seq'::regclass);


--
-- Data for Name: cookies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cookies (id, account_id, cookies, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: core_job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.core_job (id, job_title, job_desc, job_location, work_option, work_type, pay_type, currency, pay_min, pay_max, pay_display, company, seniority_level, company_url, qualifications, required_skills, preferred_skills, status, created_at, updated_at) FROM stdin;
1	tes job end	PT Zacvin is seeking a motivated and enthusiastic individual for the position of TES Job End. This entry-level role is ideal for candidates who are looking to start their career in a vibrant, innovative company. The successful candidate will be responsible for supporting various tasks associated with our operations, contributing to project completions, and collaborating with team members to deliver high-quality results.\n\nKey Responsibilities:\n- Assist in the execution of daily operational tasks and projects.\n- Collaborate with team members to meet project deadlines and achieve organizational goals.\n- Participate in team meetings and communicate ideas effectively.\n- Support various administrative functions, including data entry, documentation, and reporting.\n- Maintain a positive and proactive attitude in all interactions, both internally and externally.\n\nThis position offers flexibility through a fully remote work option and comes with a competitive salary range of IDR 10,000,000 - 11,500,000 (monthly). Join PT Zacvin and be a part of a dynamic team that values growth and innovation.	jakarta, bandung 231412 dsss	Remote	Full-time	Monthly	IDR	10000000	115000000	Hide	pt zacvin	Entry Level	https://socs.binus.ac.id/iccsci-2026	**Required Qualifications:**\n- Bachelor’s degree in a relevant field or equivalent experience.  \n- Strong communication and interpersonal skills.  \n- Basic understanding of project management principles.  \n- Proficient in Microsoft Office Suite (Word, Excel, PowerPoint).  \n- Ability to work independently and as part of a team.  \n\n**Preferred Qualifications:**\n- Prior internship or work experience in a related field.  \n- Familiarity with remote work tools and software.  \n- Self-motivated with a strong desire to learn and grow within the company.  \n- Ability to manage multiple tasks and prioritize effectively.	[{"name": "oke", "weight": 5}, {"name": "oke", "weight": 4}, {"name": "aaaa1", "weight": 1}]	[{"name": "dsadsadsa", "weight": 4}, {"name": "dsaa31122", "weight": 3}, {"name": "s", "weight": 2}, {"name": "ss", "weight": 3}]	Draft	2026-04-16 04:56:26.735516	2026-04-16 13:38:20.282161
\.


--
-- Data for Name: core_job_sourcing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.core_job_sourcing (id, account_id, platform, platform_job_id, status, last_sync, created_at, updated_at, additional) FROM stdin;
\.


--
-- Data for Name: core_project_linkedin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.core_project_linkedin (id, project_id, name, description, job_title, job_location, seniority_level, company_for, project_visible) FROM stdin;
\.


--
-- Data for Name: global_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_permissions (id, module_menu_id, functionality) FROM stdin;
1	1	read
2	1	create
3	1	update
4	1	delete
23	7	read
24	7	create
25	7	update
26	7	delete
27	8	read
28	8	create
29	8	update
30	8	delete
31	9	read
32	11	read
33	11	create
34	11	update
35	11	delete
36	10	read
37	10	create
38	10	update
39	10	delete
40	12	read
41	12	create
42	12	update
43	12	delete
44	13	read
45	13	create
46	13	update
47	13	delete
48	14	read
49	14	create
50	14	update
51	14	delete
52	15	read
53	15	create
54	15	update
55	15	delete
56	16	read
57	16	create
58	16	update
59	16	delete
60	17	read
61	17	create
62	17	update
63	17	delete
68	19	read
69	19	create
70	19	update
71	19	delete
72	20	read
73	20	create
74	20	update
75	20	delete
\.


--
-- Data for Name: mapping_candidates_linkedin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_candidates_linkedin (id, candidate_id) FROM stdin;
\.


--
-- Data for Name: mapping_candidates_seek; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_candidates_seek (id, candidate_id, candidate_status, candidate_seek_id) FROM stdin;
\.


--
-- Data for Name: mapping_job_sourcing_linkedin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_job_sourcing_linkedin (id, job_sourcing_id, project_id, linkedin_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mapping_job_sourcing_seek; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_job_sourcing_seek (id, job_sourcing_id, seek_id, currency, pay_type, created_date_seek, created_by, candidate_count, pay_min, pay_max, pay_display, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mapping_modules_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_modules_menus (id, module_id, menu_id) FROM stdin;
1	1	1
7	4	7
8	4	5
9	4	9
11	4	11
10	5	10
12	5	12
13	6	13
14	6	14
15	6	15
16	7	16
17	7	17
19	8	19
20	5	20
\.


--
-- Data for Name: mapping_roles_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_roles_permissions (id, role_id, permission_id) FROM stdin;
1	1	1
2	1	2
3	1	3
4	1	4
5	1	23
6	1	24
7	1	25
8	1	26
9	1	27
10	1	28
11	1	29
12	1	30
13	1	31
14	1	32
15	1	33
16	1	34
17	1	35
18	1	36
19	1	37
20	1	38
21	1	39
22	1	40
23	1	41
24	1	42
25	1	43
26	1	44
27	1	45
28	1	46
29	1	47
30	1	48
31	1	49
32	1	50
33	1	51
34	1	52
35	1	53
36	1	54
37	1	55
38	1	56
39	1	57
40	1	58
41	1	59
42	1	60
43	1	61
44	1	62
45	1	63
50	1	68
51	1	69
52	1	70
53	1	71
54	1	72
55	1	73
56	1	74
57	1	75
100	2	1
101	2	2
102	2	3
117	2	23
118	2	24
119	2	25
120	2	27
121	2	28
122	2	29
123	2	31
124	2	32
125	2	33
126	2	34
127	2	36
128	2	37
129	2	38
130	2	40
131	2	41
132	2	42
133	2	44
134	2	45
135	2	46
136	2	48
137	2	49
138	2	50
139	2	52
140	2	53
141	2	54
142	2	56
143	2	57
144	2	58
145	2	60
146	2	61
147	2	62
151	2	68
152	2	69
153	2	70
160	2	72
161	2	73
162	2	74
200	3	1
201	3	2
210	3	23
211	3	24
212	3	27
213	3	28
214	3	31
215	3	32
216	3	33
217	3	36
218	3	40
219	3	44
220	3	45
221	3	48
222	3	49
223	3	52
224	3	53
225	3	56
226	3	57
227	3	60
228	3	61
230	3	68
231	3	69
232	3	72
233	3	73
300	4	1
306	4	23
307	4	27
308	4	31
309	4	32
310	4	44
311	4	48
312	4	52
313	4	56
314	4	60
316	4	68
317	4	72
\.


--
-- Data for Name: mapping_users_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mapping_users_roles (id, user_id, role_id) FROM stdin;
1	1	1
2	2	2
3	3	3
4	4	3
5	5	4
\.


--
-- Data for Name: master_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_candidates (id, job_id, name, last_position, address, education, information, date, attachment) FROM stdin;
\.


--
-- Data for Name: master_job_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_job_account (id, portal_name, email, password, user_id, is_active, condition, last_sync, created_at, updated_at) FROM stdin;
1	seek	recruitment@ptap.co.id	3c88eb5c9c2f80f0ef1c8f4db0328131:919b22545753adae0544cba08c0f750f	1	t	Not Connected	\N	2026-04-16 05:48:21.225772	2026-04-16 05:48:21.225772
\.


--
-- Data for Name: master_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_menus (id, name) FROM stdin;
1	Search
5	Company List
7	General
9	Help
10	User Management
11	Integrations
12	Role Management
13	Seek
14	LinkedIn
15	Account
16	Seek Sourcing
17	LinkedIn Sourcing
19	Job Management
20	Recruiters
\.


--
-- Data for Name: master_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_modules (id, name) FROM stdin;
1	Candidates
4	Settings
5	Users
6	Job Postings
7	Job Management
8	Sourcing
\.


--
-- Data for Name: master_recruiters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_recruiters (id, name, email, jobs_assigned, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: master_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_roles (id, name, additional) FROM stdin;
1	Admin	{}
2	Manager	{}
3	Staff	{}
4	Intern	{"certificate": "UAA-XXXXXX"}
\.


--
-- Data for Name: master_sourcing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_sourcing (id, job_title, location, skill, company, school, year_graduate, industry, keyword) FROM stdin;
\.


--
-- Data for Name: master_sourcing_recruite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_sourcing_recruite (id, sourcing_id, name, skill, information, date_created) FROM stdin;
\.


--
-- Data for Name: master_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_users (id, password, email, username) FROM stdin;
1	$2b$12$wWX/NCMyJzr9UBXDkLJUxucbdCgo8MP/xPMorsrZMFHeLAAqrO/uy	user1@example.com	user1
2	$2b$12$rMyF5/vyQwaRA3NGi1DGUu6R9O4K6rmf5ta7L48ZIu59BdXrmoyrS	user2@example.com	user2
3	$2b$12$qkiGQRDgCM2DT9Pno3TEhuJMOy1LZwAEMwtSSpgnnVb062S06bYDu	user3@example.com	user3
4	$2b$12$pUY4YmQM1C6//Yvl7NTQR.V5YMXZhuN4gjsOA8HZ8A9WgCxOfty2W	user4@example.com	user4
5	$2b$12$ZsTwRF9aO0wOiPHcpJsGteAkWkH3H9bXmI8CeCtUzOECO1oG..IOe	user5@example.com	user5
\.


--
-- Name: cookies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cookies_id_seq', 1, false);


--
-- Name: core_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.core_job_id_seq', 1, true);


--
-- Name: core_job_sourcing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.core_job_sourcing_id_seq', 1, false);


--
-- Name: core_project_linkedin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.core_project_linkedin_id_seq', 1, false);


--
-- Name: global_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.global_permissions_id_seq', 75, true);


--
-- Name: mapping_candidates_linkedin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_candidates_linkedin_id_seq', 1, false);


--
-- Name: mapping_candidates_seek_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_candidates_seek_id_seq', 1, false);


--
-- Name: mapping_job_sourcing_linkedin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_job_sourcing_linkedin_id_seq', 1, false);


--
-- Name: mapping_job_sourcing_seek_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_job_sourcing_seek_id_seq', 1, false);


--
-- Name: mapping_modules_menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_modules_menus_id_seq', 20, true);


--
-- Name: mapping_roles_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_roles_permissions_id_seq', 317, true);


--
-- Name: mapping_users_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mapping_users_roles_id_seq', 5, true);


--
-- Name: master_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_candidates_id_seq', 1, false);


--
-- Name: master_job_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_job_account_id_seq', 1, true);


--
-- Name: master_menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_menus_id_seq', 20, true);


--
-- Name: master_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_modules_id_seq', 8, true);


--
-- Name: master_recruiters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_recruiters_id_seq', 1, false);


--
-- Name: master_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_roles_id_seq', 4, true);


--
-- Name: master_sourcing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_sourcing_id_seq', 1, false);


--
-- Name: master_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_users_id_seq', 5, true);


--
-- Name: cookies cookies_account_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cookies
    ADD CONSTRAINT cookies_account_id_key UNIQUE (account_id);


--
-- Name: cookies cookies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cookies
    ADD CONSTRAINT cookies_pkey PRIMARY KEY (id);


--
-- Name: core_job core_job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job
    ADD CONSTRAINT core_job_pkey PRIMARY KEY (id);


--
-- Name: core_job_sourcing core_job_sourcing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job_sourcing
    ADD CONSTRAINT core_job_sourcing_pkey PRIMARY KEY (id);


--
-- Name: core_job_sourcing core_job_sourcing_platform_account_id_platform_job_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job_sourcing
    ADD CONSTRAINT core_job_sourcing_platform_account_id_platform_job_id_key UNIQUE (platform, account_id, platform_job_id);


--
-- Name: core_project_linkedin core_project_linkedin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_project_linkedin
    ADD CONSTRAINT core_project_linkedin_pkey PRIMARY KEY (id);


--
-- Name: global_permissions global_permissions_module_menu_id_functionality_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_permissions
    ADD CONSTRAINT global_permissions_module_menu_id_functionality_key UNIQUE (module_menu_id, functionality);


--
-- Name: global_permissions global_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_permissions
    ADD CONSTRAINT global_permissions_pkey PRIMARY KEY (id);


--
-- Name: mapping_candidates_linkedin mapping_candidates_linkedin_candidate_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_linkedin
    ADD CONSTRAINT mapping_candidates_linkedin_candidate_id_key UNIQUE (candidate_id);


--
-- Name: mapping_candidates_linkedin mapping_candidates_linkedin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_linkedin
    ADD CONSTRAINT mapping_candidates_linkedin_pkey PRIMARY KEY (id);


--
-- Name: mapping_candidates_seek mapping_candidates_seek_candidate_seek_id_candidate_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_seek
    ADD CONSTRAINT mapping_candidates_seek_candidate_seek_id_candidate_id_key UNIQUE (candidate_seek_id, candidate_id);


--
-- Name: mapping_candidates_seek mapping_candidates_seek_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_seek
    ADD CONSTRAINT mapping_candidates_seek_pkey PRIMARY KEY (id);


--
-- Name: mapping_job_sourcing_linkedin mapping_job_sourcing_linkedin_job_sourcing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin
    ADD CONSTRAINT mapping_job_sourcing_linkedin_job_sourcing_id_key UNIQUE (job_sourcing_id);


--
-- Name: mapping_job_sourcing_linkedin mapping_job_sourcing_linkedin_linkedin_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin
    ADD CONSTRAINT mapping_job_sourcing_linkedin_linkedin_id_key UNIQUE (linkedin_id);


--
-- Name: mapping_job_sourcing_linkedin mapping_job_sourcing_linkedin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin
    ADD CONSTRAINT mapping_job_sourcing_linkedin_pkey PRIMARY KEY (id);


--
-- Name: mapping_job_sourcing_seek mapping_job_sourcing_seek_job_sourcing_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_seek
    ADD CONSTRAINT mapping_job_sourcing_seek_job_sourcing_id_key UNIQUE (job_sourcing_id);


--
-- Name: mapping_job_sourcing_seek mapping_job_sourcing_seek_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_seek
    ADD CONSTRAINT mapping_job_sourcing_seek_pkey PRIMARY KEY (id);


--
-- Name: mapping_job_sourcing_seek mapping_job_sourcing_seek_seek_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_seek
    ADD CONSTRAINT mapping_job_sourcing_seek_seek_id_key UNIQUE (seek_id);


--
-- Name: mapping_modules_menus mapping_modules_menus_module_id_menu_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_modules_menus
    ADD CONSTRAINT mapping_modules_menus_module_id_menu_id_key UNIQUE (module_id, menu_id);


--
-- Name: mapping_modules_menus mapping_modules_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_modules_menus
    ADD CONSTRAINT mapping_modules_menus_pkey PRIMARY KEY (id);


--
-- Name: mapping_roles_permissions mapping_roles_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_roles_permissions
    ADD CONSTRAINT mapping_roles_permissions_pkey PRIMARY KEY (id);


--
-- Name: mapping_roles_permissions mapping_roles_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_roles_permissions
    ADD CONSTRAINT mapping_roles_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: mapping_users_roles mapping_users_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_users_roles
    ADD CONSTRAINT mapping_users_roles_pkey PRIMARY KEY (id);


--
-- Name: mapping_users_roles mapping_users_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_users_roles
    ADD CONSTRAINT mapping_users_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: master_candidates master_candidates_name_job_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_candidates
    ADD CONSTRAINT master_candidates_name_job_id_key UNIQUE (name, job_id);


--
-- Name: master_candidates master_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_candidates
    ADD CONSTRAINT master_candidates_pkey PRIMARY KEY (id);


--
-- Name: master_job_account master_job_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_job_account
    ADD CONSTRAINT master_job_account_pkey PRIMARY KEY (id);


--
-- Name: master_menus master_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_menus
    ADD CONSTRAINT master_menus_pkey PRIMARY KEY (id);


--
-- Name: master_modules master_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_modules
    ADD CONSTRAINT master_modules_pkey PRIMARY KEY (id);


--
-- Name: master_recruiters master_recruiters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_recruiters
    ADD CONSTRAINT master_recruiters_pkey PRIMARY KEY (id);


--
-- Name: master_roles master_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_roles
    ADD CONSTRAINT master_roles_pkey PRIMARY KEY (id);


--
-- Name: master_sourcing master_sourcing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sourcing
    ADD CONSTRAINT master_sourcing_pkey PRIMARY KEY (id);


--
-- Name: master_sourcing_recruite master_sourcing_recruite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sourcing_recruite
    ADD CONSTRAINT master_sourcing_recruite_pkey PRIMARY KEY (id);


--
-- Name: master_users master_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_users
    ADD CONSTRAINT master_users_pkey PRIMARY KEY (id);


--
-- Name: cookies cookies_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cookies
    ADD CONSTRAINT cookies_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.master_job_account(id) ON DELETE CASCADE;


--
-- Name: core_job_sourcing core_job_sourcing_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.core_job_sourcing
    ADD CONSTRAINT core_job_sourcing_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.master_job_account(id) ON DELETE CASCADE;


--
-- Name: global_permissions global_permissions_module_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_permissions
    ADD CONSTRAINT global_permissions_module_menu_id_fkey FOREIGN KEY (module_menu_id) REFERENCES public.mapping_modules_menus(id) ON DELETE CASCADE;


--
-- Name: mapping_candidates_linkedin mapping_candidates_linkedin_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_linkedin
    ADD CONSTRAINT mapping_candidates_linkedin_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(id) ON DELETE CASCADE;


--
-- Name: mapping_candidates_seek mapping_candidates_seek_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_candidates_seek
    ADD CONSTRAINT mapping_candidates_seek_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.master_candidates(id) ON DELETE CASCADE;


--
-- Name: mapping_job_sourcing_linkedin mapping_job_sourcing_linkedin_job_sourcing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin
    ADD CONSTRAINT mapping_job_sourcing_linkedin_job_sourcing_id_fkey FOREIGN KEY (job_sourcing_id) REFERENCES public.core_job_sourcing(id) ON DELETE CASCADE;


--
-- Name: mapping_job_sourcing_linkedin mapping_job_sourcing_linkedin_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_linkedin
    ADD CONSTRAINT mapping_job_sourcing_linkedin_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.core_project_linkedin(id) ON DELETE SET NULL;


--
-- Name: mapping_job_sourcing_seek mapping_job_sourcing_seek_job_sourcing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_job_sourcing_seek
    ADD CONSTRAINT mapping_job_sourcing_seek_job_sourcing_id_fkey FOREIGN KEY (job_sourcing_id) REFERENCES public.core_job_sourcing(id) ON DELETE CASCADE;


--
-- Name: mapping_modules_menus mapping_modules_menus_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_modules_menus
    ADD CONSTRAINT mapping_modules_menus_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.master_menus(id) ON DELETE CASCADE;


--
-- Name: mapping_modules_menus mapping_modules_menus_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_modules_menus
    ADD CONSTRAINT mapping_modules_menus_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.master_modules(id) ON DELETE CASCADE;


--
-- Name: mapping_roles_permissions mapping_roles_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_roles_permissions
    ADD CONSTRAINT mapping_roles_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.global_permissions(id) ON DELETE CASCADE;


--
-- Name: mapping_roles_permissions mapping_roles_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_roles_permissions
    ADD CONSTRAINT mapping_roles_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.master_roles(id) ON DELETE CASCADE;


--
-- Name: mapping_users_roles mapping_users_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_users_roles
    ADD CONSTRAINT mapping_users_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.master_roles(id) ON DELETE CASCADE;


--
-- Name: mapping_users_roles mapping_users_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mapping_users_roles
    ADD CONSTRAINT mapping_users_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.master_users(id) ON DELETE CASCADE;


--
-- Name: master_candidates master_candidates_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_candidates
    ADD CONSTRAINT master_candidates_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.core_job(id) ON DELETE CASCADE;


--
-- Name: master_job_account master_job_account_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_job_account
    ADD CONSTRAINT master_job_account_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.master_users(id) ON DELETE CASCADE;


--
-- Name: master_sourcing_recruite master_sourcing_recruite_sourcing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sourcing_recruite
    ADD CONSTRAINT master_sourcing_recruite_sourcing_id_fkey FOREIGN KEY (sourcing_id) REFERENCES public.master_sourcing(id);


--
-- PostgreSQL database dump complete
--

\unrestrict F7Vsm7XAgDcCGaYxrcrsbI6EgNByET3cduXl9WljwZpe3mabObbiebPmN7ZSFXq


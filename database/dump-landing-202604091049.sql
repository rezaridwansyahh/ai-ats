--
-- PostgreSQL database dump
--

\restrict w9hJbAIFIAJDzCacimVt8dmrxXT1W0sGsiiXltVuUj383ca0zB5qxI2LuFQr7KQ

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-09 10:49:34

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
-- TOC entry 857 (class 1247 OID 34222)
-- Name: booking_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status_type AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.booking_status_type OWNER TO postgres;

--
-- TOC entry 860 (class 1247 OID 34230)
-- Name: session_slot_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_slot_type AS ENUM (
    '10-12',
    '1-3',
    '4-6'
);


ALTER TYPE public.session_slot_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 34269)
-- Name: master_email_notify; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_email_notify (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    label character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.master_email_notify OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 34268)
-- Name: master_email_notify_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_email_notify_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_email_notify_id_seq OWNER TO postgres;

--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 223
-- Name: master_email_notify_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_email_notify_id_seq OWNED BY public.master_email_notify.id;


--
-- TOC entry 222 (class 1259 OID 34251)
-- Name: master_landing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_landing (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    company_size character varying(100),
    average_annual_hiring character varying(100),
    message text,
    booking_date date,
    session_slot public.session_slot_type,
    status public.booking_status_type DEFAULT 'pending'::public.booking_status_type NOT NULL,
    rejection_reason text,
    conference_link text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.master_landing OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 34250)
-- Name: master_landing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_landing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_landing_id_seq OWNER TO postgres;

--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 221
-- Name: master_landing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_landing_id_seq OWNED BY public.master_landing.id;


--
-- TOC entry 220 (class 1259 OID 34238)
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
-- TOC entry 219 (class 1259 OID 34237)
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
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 219
-- Name: master_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_users_id_seq OWNED BY public.master_users.id;


--
-- TOC entry 4830 (class 2604 OID 34272)
-- Name: master_email_notify id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_email_notify ALTER COLUMN id SET DEFAULT nextval('public.master_email_notify_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 34254)
-- Name: master_landing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_landing ALTER COLUMN id SET DEFAULT nextval('public.master_landing_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 34241)
-- Name: master_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_users ALTER COLUMN id SET DEFAULT nextval('public.master_users_id_seq'::regclass);


--
-- TOC entry 4993 (class 0 OID 34269)
-- Dependencies: 224
-- Data for Name: master_email_notify; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_email_notify (id, email, label, is_active, created_at) FROM stdin;
2	mluthfinaufal99@gmail.com	\N	t	2026-03-30 13:44:59.139918
\.


--
-- TOC entry 4991 (class 0 OID 34251)
-- Dependencies: 222
-- Data for Name: master_landing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_landing (id, name, email, company_size, average_annual_hiring, message, booking_date, session_slot, status, rejection_reason, conference_link, created_at, updated_at) FROM stdin;
3	user`	user1@example.com	2,501 – 5,000 employees	251 – 500 hires/year	testing	2026-03-31	1-3	pending	\N	\N	2026-03-31 12:31:31.367137	2026-03-31 12:31:31.367137
2	testing	testing@example.com	1 – 100 employees	Up to 50 hires/year	testing	2026-03-31	10-12	approved	\N	http:/example	2026-03-30 13:45:46.366067	2026-03-31 12:32:01.839567
\.


--
-- TOC entry 4989 (class 0 OID 34238)
-- Dependencies: 220
-- Data for Name: master_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_users (id, password, email, username) FROM stdin;
1	$2b$12$54fAzWM5rstz0gwbG6iz6OOLVDRi64h8WL6h5/DTV6aweYC3r4yOG	user1@example.com	user1
2	$2b$12$rofJFE0w3Co4NnaJ5336qeewvhEfJfh/sMql/VzD8bzDhxggBPDjC	user2@example.com	user2
3	$2b$12$U64SB.WX3yNbUfBB5q77MuBeURV58bXGQd0CCNbNnK/yNeh5/rAUO	user3@example.com	user3
4	$2b$12$oL6PxQpz44hsKLEVJ1ICJuiNmHwqgkoZ6rof/NCBLATYbtdyGEuEC	user4@example.com	user4
5	$2b$12$MnRig6UHiwJ4BLNiY2SoL.HLl5gEOeQdmAQPwetlI2Bi7Ya/sifxe	user5@example.com	user5
\.


--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 223
-- Name: master_email_notify_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_email_notify_id_seq', 3, true);


--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 221
-- Name: master_landing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_landing_id_seq', 3, true);


--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 219
-- Name: master_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_users_id_seq', 5, true);


--
-- TOC entry 4838 (class 2606 OID 34280)
-- Name: master_email_notify master_email_notify_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_email_notify
    ADD CONSTRAINT master_email_notify_email_key UNIQUE (email);


--
-- TOC entry 4840 (class 2606 OID 34278)
-- Name: master_email_notify master_email_notify_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_email_notify
    ADD CONSTRAINT master_email_notify_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 34267)
-- Name: master_landing master_landing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_landing
    ADD CONSTRAINT master_landing_pkey PRIMARY KEY (id);


--
-- TOC entry 4834 (class 2606 OID 34249)
-- Name: master_users master_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_users
    ADD CONSTRAINT master_users_pkey PRIMARY KEY (id);


-- Completed on 2026-04-09 10:49:34

--
-- PostgreSQL database dump complete
--

\unrestrict w9hJbAIFIAJDzCacimVt8dmrxXT1W0sGsiiXltVuUj383ca0zB5qxI2LuFQr7KQ


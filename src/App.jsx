import React, { useState, useEffect, useMemo } from 'react';
import { Search, Server, Wrench, Menu, X, ChevronDown, ChevronUp, Database, Activity, Code, Info, Layers, Sun, Moon, Sparkles, MessageSquare, Loader2, Play } from 'lucide-react';

// Core Server Order based on order.txt
const SERVER_ORDER = [
  { id: 'brave-search', label: 'Brave Search', count: 2, icon: Search },
  { id: 'calculator', label: 'Calculator', count: 1, icon: Code },
  { id: 'clinicaltrialsgov-mcp-server', label: 'ClinicalTrials.gov', count: 3, icon: Database },
  { id: 'dicom-mcp', label: 'DICOM MCP', count: 11, icon: Activity },
  { id: 'healthcare-mcp', label: 'Healthcare Tools', count: 11, icon: Activity },
  { id: 'medicaid-mcp', label: 'Medicaid', count: 1, icon: Database },
  { id: 'nexonco-mcp', label: 'Nexonco', count: 1, icon: Activity },
  { id: 'npi-registry', label: 'NPI Registry', count: 1, icon: Database },
  { id: 'pubmed', label: 'PubMed', count: 4, icon: Database },
  { id: 'athenahealth', label: 'Athenahealth', count: 14, icon: Activity },
  { id: 'who-mcp', label: 'WHO Global Health', count: 1, icon: Database },
  { id: 'medcalc', label: 'Medical Calculator', count: 5, icon: Code },
  { id: 'mcp-icd10', label: 'ICD-10', count: 5, icon: Database },
  { id: 'snomed-ct-mcp', label: 'SNOMED CT', count: 3, icon: Database },
  { id: 'mcp-loinc', label: 'LOINC', count: 6, icon: Database },
  { id: 'medical-billing-mcp', label: 'Medical Billing Rules', count: 6, icon: Database },
  { id: 'nccn-guidelines', label: 'NCCN Guidelines', count: 3, icon: Database },
  { id: 'lab-info-system', label: 'Lab Info System', count: 7, icon: Activity },
  { id: 'e-prescribing', label: 'E-Prescribing', count: 6, icon: Activity },
  { id: 'prior-auth', label: 'Prior Authorization', count: 8, icon: Activity },
  { id: 'medical-billing-claims', label: 'Medical Billing Claims', count: 8, icon: Database },
  { id: 'referral-management', label: 'Referral Management', count: 8, icon: Activity },
  { id: 'clinical-documentation', label: 'Clinical Documentation', count: 7, icon: Activity },
  { id: 'radiology-info-system', label: 'Radiology Info System', count: 8, icon: Activity }
];

// Condensed repetitive schema boilerplate for cleaner parsing and UI
const RAW_TEXT = `
Name: athenahealth_search_patients
Description: Search for patients by demographics or contact information. Args: firstname: Patient's first name (partial match) lastname: Patient's last name (partial match) dob: Date of birth in YYYY-MM-DD format (exact match) phone: Phone number (partial match, ignores formatting) email: Email address (partial match) limit: Maximum number of results (default 10) At least one search parameter must be provided. Returns matching patients with their demographic information.
Input Schema:
Properties: Firstname, Lastname, Dob, Phone, Email, Limit (Default: 10)

Name: athenahealth_get_clinical_summary
Description: Retrieve comprehensive clinical summary for a patient. Args: patient_id: The patient's ID Returns complete clinical summary including: - Patient demographics - Active allergies - Active problems/diagnoses - Latest vitals - Recent lab results - Active medications
Input Schema:
Properties: Patient Id (Required)

Name: athenahealth_get_patient_encounters
Description: Get patient encounters/visits. Args: patient_id: The patient's ID (required) status: Filter by status - open, closed, or in_progress (optional) limit: Maximum number of results (default 20) Returns encounter history with provider and department details.
Input Schema:
Properties: Patient Id (Required), Status, Limit (Default: 20)

Name: healthcare-mcp_lookup_icd_code
Description: Look up ICD-10 codes by code or description
Input Schema:
Properties: Code (String), Description (String), Max Results (Number, Default: 10, Max: 50)

Name: healthcare-mcp_health_topics
Description: Get evidence-based health information on various topics
Input Schema:
Properties: Topic (String, Required), Language (String, Default: en)

Name: healthcare-mcp_pubmed_search
Description: Search for medical literature in PubMed database
Input Schema:
Properties: Query (String, Required), Max Results (Number, Default: 5), Date Range (String), Open Access (Boolean)

Name: medcalc_list_calculators
Description: List all available medical calculators. Args: category: Optional category filter (e.g., 'cardiology', 'nephrology', 'hepatology') Returns: List of calculators with names, descriptions, and categories
Input Schema:
Properties: Category (String)

Name: medcalc_list_categories
Description: List all available calculator categories. Returns: List of medical specialties/categories (e.g., cardiology, nephrology, hepatology)

Name: medcalc_get_calculator_info
Description: Get detailed information about a specific medical calculator. Args: calculator_name: Name of the calculator (e.g., 'bmi', 'gfr_ckd_epi', 'meld_score') Returns: Calculator details including parameters, formula, interpretation, and references
Input Schema:
Properties: Calculator Name (String, Required)

Name: medcalc_calculate
Description: Run a medical calculation. Args: calculator_name: Name of the calculator to use parameters: Input parameters for the calculation (varies by calculator) Returns: Calculation result with value, interpretation, and risk assessment Examples: - BMI: calculate("bmi", {"weight_kg": 70, "height_cm": 175}) - GFR: calculate("gfr_ckd_epi", {"creatinine": 1.2, "age": 55, "sex": "male"}) - MELD: calculate("meld_score", {"bilirubin": 2.0, "inr": 1.5, "creatinine": 1.0})
Input Schema:
Properties: Calculator Name (String, Required), Parameters (Object, Required)

Name: medcalc_get_calculator_parameters
Description: Get the required and optional parameters for a calculator. Args: calculator_name: Name of the calculator Returns: List of parameters with names, types, descriptions, and valid ranges
Input Schema:
Properties: Calculator Name (String, Required)

Name: mcp-icd10_lookup_code
Description: Look up a medical code and return its description. Args: code: Medical code (e.g., 'E11.9', '250.00'). Dots optional. system: 'icd10cm', 'icd9cm', or 'icd10who'. Empty = search all.
Input Schema:
Properties: Code (String, Required), System (String)

Name: mcp-icd10_search_codes
Description: Search codes by clinical description using full-text search. Args: query: Clinical description or keywords (e.g., 'type 2 diabetes'). system: 'icd10cm', 'icd9cm', or 'icd10who'. Empty = all systems. limit: Max results (default 20, max 50).
Input Schema:
Properties: Query (String, Required), System (String), Limit (Integer, Default: 20)

Name: mcp-icd10_browse_category
Description: Browse all codes under a category prefix. Args: prefix: Category prefix (e.g., 'E11', 'I25', '250'). system: 'icd10cm' (default), 'icd9cm', or 'icd10who'. limit: Max results (default 50, max 100).
Input Schema:
Properties: Prefix (String, Required), System (String, Default: icd10cm), Limit (Integer)

Name: mcp-icd10_translate_code
Description: Translate between ICD-9-CM and ICD-10-CM using GEMs crosswalk. Args: code: Source code (e.g., '250.00' for ICD-9, 'E119' for ICD-10-CM). source_system: 'icd9cm' or 'icd10cm'. Empty = auto-detect.
Input Schema:
Properties: Code (String, Required), Source System (String)

Name: clinicaltrialsgov-mcp-server_clinicaltrials_list_studies
Description: Searches for clinical studies using a combination of query terms and filters. Supports pagination, sorting, and geographic filtering.
Input Schema:
Properties: Query (Object), Filter (Object), Fields (Array), Sort (Array), Page Size (Integer), Page Token (String), Count Total (Boolean)

Name: clinicaltrialsgov-mcp-server_clinicaltrials_analyze_trends
Description: Performs a statistical analysis on a set of clinical trials, aggregating data by status, country, sponsor, or phase. Use specific query parameters to refine the analysis and filter the studies included in the analysis. The tool can handle up to 5000 studies per analysis.
Input Schema:
Properties: Query (Object), Filter (Object), Analysis Type (String, Required)

Name: radiology-info-system_get_critical_findings
Description: Get urgent/critical findings requiring immediate attention. Args: radiologist_id: Filter by reporting radiologist start_date: Filter findings communicated on or after this date (YYYY-MM-DD) end_date: Filter findings communicated on or before this date (YYYY-MM-DD) Returns: List of critical findings
Input Schema:
Properties: Radiologist Id, Start Date, End Date

Name: radiology-info-system_get_exam_schedule
Description: Get upcoming imaging appointments. Args: department_id: Filter by department/location start_date: Filter appointments on or after this date (YYYY-MM-DD) end_date: Filter appointments on or before this date (YYYY-MM-DD) Returns: List of scheduled imaging appointments
Input Schema:
Properties: Department Id, Start Date, End Date

Name: radiology-info-system_search_exams
Description: Search exams by multiple criteria. Args: patient_id: Filter by patient ID modality: Filter by imaging modality (XR, CT, MRI, US, NM, PET) body_part: Filter by body part start_date: Filter exams on or after this date (YYYY-MM-DD) end_date: Filter exams on or before this date (YYYY-MM-DD) Returns: List of matching exams
Input Schema:
Properties: Patient Id, Modality, Body Part, Start Date, End Date

Name: radiology-info-system_get_report_history
Description: Get past imaging reports for a patient for comparison. Args: patient_id: The patient's unique ID body_part: Filter by body part (e.g., Chest, Lumbar Spine, Thyroid) modality: Filter by imaging modality (XR, CT, MRI, US) Returns: List of past radiology reports
Input Schema:
Properties: Patient Id (Required), Body Part, Modality

Name: radiology-info-system_get_radiology_report
Description: Get the finalized radiology report with findings, impressions, and recommendations. Args: exam_id: The exam ID to get the report for Returns: Radiology report or error if not found
Input Schema:
Properties: Exam Id (Required)

Name: radiology-info-system_get_worklist
Description: Get scheduled/pending exams for reading. Args: radiologist_id: Filter by assigned radiologist date: Filter by exam date (YYYY-MM-DD) modality: Filter by imaging modality Returns: List of exams awaiting reading
Input Schema:
Properties: Radiologist Id, Date, Modality

Name: radiology-info-system_get_exam_details
Description: Get exam details including modality, body part, protocol, status, and timestamps. Args: exam_id: The unique exam ID Returns: Full exam details or error if not found
Input Schema:
Properties: Exam Id (Required)

Name: radiology-info-system_get_radiology_orders
Description: Get imaging orders for a patient with optional filters. Args: patient_id: The patient's unique ID status: Filter by order status (ordered, scheduled, in_progress, completed, cancelled) modality: Filter by imaging modality (XR, CT, MRI, US, NM, PET) Returns: List of radiology orders matching the filters
Input Schema:
Properties: Patient Id (Required), Status, Modality

Name: clinical-documentation_get_documentation_status
Description: Check which encounters have complete vs incomplete documentation for a provider. Args: provider_id: The provider's unique ID date: Optional date to check (YYYY-MM-DD). If omitted, checks all dates. Returns: Documentation completeness summary with list of unsigned notes
Input Schema:
Properties: Provider Id (Required), Date

Name: clinical-documentation_get_note_history
Description: Get revision history and addenda for a specific note. Args: note_id: The unique note ID Returns: Note metadata and any addenda
Input Schema:
Properties: Note Id (Required)

Name: clinical-documentation_get_unsigned_notes
Description: Get notes pending provider signature. Args: provider_id: The provider's unique ID Returns: List of unsigned notes for the provider
Input Schema:
Properties: Provider Id (Required)

Name: clinical-documentation_search_notes
Description: Search across clinical notes by keyword or diagnosis. Args: patient_id: The patient's unique ID keyword: Text to search for in note content (subjective, objective, assessment, plan) diagnosis: Diagnosis text or ICD-10 code to search for start_date: Filter notes created on or after this date (YYYY-MM-DD) end_date: Filter notes created on or before this date (YYYY-MM-DD) Returns: List of matching clinical notes
Input Schema:
Properties: Patient Id (Required), Keyword, Diagnosis, Start Date, End Date

Name: clinical-documentation_get_note_templates
Description: Get available note templates filtered by visit type or specialty. Args: visit_type: Filter by visit type (e.g., follow_up, annual_physical, consult) specialty: Filter by medical specialty (e.g., Internal Medicine, Cardiology) Returns: List of matching note templates
Input Schema:
Properties: Visit Type, Specialty

Name: clinical-documentation_get_note_details
Description: Get full SOAP note with all sections, ICD/CPT codes, and signature status. Args: note_id: The unique note ID Returns: Full note details or error if not found
Input Schema:
Properties: Note Id (Required)

Name: clinical-documentation_get_encounter_notes
Description: Get clinical notes for a patient with optional filters. Args: patient_id: The patient's unique ID provider_id: Filter by authoring provider start_date: Filter notes created on or after this date (YYYY-MM-DD) end_date: Filter notes created on or before this date (YYYY-MM-DD) note_type: Filter by note type (progress_note, consult_note, annual_physical, etc.) Returns: List of clinical notes matching the filters
Input Schema:
Properties: Patient Id (Required), Provider Id, Start Date, End Date, Note Type

Name: referral-management_get_referral_analytics
Description: Get referral completion rates, average time-to-schedule, and leakage metrics. Args: provider_id: Optional provider ID to scope analytics start_date: Start date for analytics window (YYYY-MM-DD) end_date: End date for analytics window (YYYY-MM-DD) Returns: Analytics including completion rates and timing metrics
Input Schema:
Properties: Provider Id, Start Date, End Date

Name: referral-management_get_econsult_thread
Description: Get e-consult messages between referring and receiving providers for a referral. Args: referral_id: The referral ID to get messages for Returns: Thread of e-consult messages
Input Schema:
Properties: Referral Id (Required)

Name: referral-management_search_specialists
Description: Find specialists by specialty, location, insurance accepted, or availability. Args: specialty: Filter by medical specialty (e.g., Cardiology, Orthopedics) location: Filter by city, state, or zip code insurance: Filter by accepted insurance plan accepting_new: Filter by whether the specialist is accepting new patients Returns: List of matching specialists
Input Schema:
Properties: Specialty, Location, Insurance, Accepting New

Name: referral-management_get_referral_history
Description: Get all past referrals for a patient. Args: patient_id: The patient's unique ID Returns: Complete referral history for the patient
Input Schema:
Properties: Patient Id (Required)

Name: referral-management_get_pending_referrals
Description: Get referrals awaiting action (sent but not scheduled, etc.). Args: provider_id: Optional provider ID to filter by (as referring or receiving provider) Returns: List of pending referrals
Input Schema:
Properties: Provider Id

Name: referral-management_get_referral_status
Description: Get the lifecycle status of a referral (created, sent, received, scheduled, completed, closed). Args: referral_id: The unique referral ID Returns: Current status and timeline of the referral
Input Schema:
Properties: Referral Id (Required)

Name: referral-management_get_referral_details
Description: Get full referral details including clinical notes, providers, and status timeline. Args: referral_id: The unique referral ID Returns: Full referral details or error if not found
Input Schema:
Properties: Referral Id (Required)

Name: referral-management_get_referrals
Description: Get referrals for a patient with optional status and date filters. Args: patient_id: The patient's unique ID status: Filter by status (created, sent, scheduled, completed, closed) start_date: Filter referrals created on or after this date (YYYY-MM-DD) end_date: Filter referrals created on or before this date (YYYY-MM-DD) Returns: List of referrals matching the filters
Input Schema:
Properties: Patient Id (Required), Status, Start Date, End Date

Name: medical-billing-claims_get_denial_summary
Description: Get aggregate denial analytics - top reasons, rates by payer. Args: provider_id: Filter by provider ID start_date: Filter from this date (YYYY-MM-DD) end_date: Filter up to this date (YYYY-MM-DD) Returns: Denial analytics with top reasons and rates by payer
Input Schema:
Properties: Provider Id, Start Date, End Date

Name: medical-billing-claims_get_aging_report
Description: Get accounts receivable aging report by bucket (0-30, 31-60, 61-90, 90+ days). Args: provider_id: Filter by provider ID department_id: Filter by department ID Returns: AR aging buckets with claim counts and totals
Input Schema:
Properties: Provider Id, Department Id

Name: medical-billing-claims_get_patient_balance
Description: Get outstanding patient balance with breakdown by claim. Args: patient_id: The patient's unique identifier Returns: Outstanding balance details per claim
Input Schema:
Properties: Patient Id (Required)

Name: medical-billing-claims_get_remittance
Description: Get payment/remittance details for a claim. Args: claim_id: The unique claim identifier Returns: Remittance records for the claim
Input Schema:
Properties: Claim Id (Required)

Name: medical-billing-claims_get_denials
Description: Get denied claims with CARC/RARC reason codes. Args: provider_id: Filter by provider ID start_date: Filter denials from this date (YYYY-MM-DD) end_date: Filter denials up to this date (YYYY-MM-DD) reason_code: Filter by CARC or RARC code Returns: List of denied claims with reason codes
Input Schema:
Properties: Provider Id, Start Date, End Date, Reason Code

Name: medical-billing-claims_get_claim_status
Description: Get the lifecycle status of a specific claim. Args: claim_id: The unique claim identifier Returns: Claim status with key dates
Input Schema:
Properties: Claim Id (Required)

Name: medical-billing-claims_get_claim_details
Description: Get full claim details including line items, amounts, and status. Args: claim_id: The unique claim identifier Returns: Claim details with line items
Input Schema:
Properties: Claim Id (Required)

Name: medical-billing-claims_get_claims
Description: Get claims with optional filters by patient, provider, status, or date range. Args: patient_id: Filter by patient ID provider_id: Filter by provider ID status: Filter by claim status (submitted, accepted, adjudicated, paid, denied) start_date: Filter claims submitted on or after this date (YYYY-MM-DD) end_date: Filter claims submitted on or before this date (YYYY-MM-DD) Returns: List of matching claims
Input Schema:
Properties: Patient Id, Provider Id, Status, Start Date, End Date

Name: prior-auth_get_patient_coverage
Description: Get insurance coverage details for a patient. Args: patient_id: The patient's unique identifier Returns: Coverage records for the patient
Input Schema:
Properties: Patient Id (Required)

Name: prior-auth_get_eligibility_status
Description: Check if patient's insurance coverage is active with copay/deductible info. Args: patient_id: The patient's unique identifier Returns: Active eligibility status with copay and deductible details
Input Schema:
Properties: Patient Id (Required)

Name: prior-auth_get_benefits
Description: Get benefit details for a patient, optionally filtered by service type. Args: patient_id: The patient's unique identifier service_type: Optional service type to filter benefits Returns: Benefit details including copays, deductible, and coinsurance
Input Schema:
Properties: Patient Id (Required), Service Type

Name: prior-auth_get_auth_requirements
Description: Check if a procedure/service requires prior authorization for a given payer. Args: cpt_code: The CPT code for the procedure payer_id: Optional payer ID to check specific payer rules Returns: Authorization requirements for the procedure
Input Schema:
Properties: Cpt Code (Required), Payer Id

Name: prior-auth_get_determination_letter
Description: Get approval/denial determination details including reason and appeal instructions. Args: auth_id: The authorization request ID Returns: Determination letter with reason and appeal information
Input Schema:
Properties: Auth Id (Required)

Name: prior-auth_get_payer_rules
Description: Get payer-specific authorization rules and requirements for procedures. Args: payer_id: The payer's unique identifier cpt_code: Optional CPT code to get rules for a specific procedure Returns: Payer rules and authorization requirements
Input Schema:
Properties: Payer Id (Required), Cpt Code

Name: prior-auth_get_auth_history
Description: Get past and current prior authorizations for a patient. Args: patient_id: The patient's unique identifier status: Optional filter by status (pending, approved, denied) Returns: List of prior authorizations for the patient
Input Schema:
Properties: Patient Id (Required), Status

Name: prior-auth_get_prior_auth_status
Description: Get the status of an existing prior authorization request. Args: auth_id: The authorization request ID Returns: Current status and details of the authorization
Input Schema:
Properties: Auth Id (Required)

Name: e-prescribing_get_controlled_substance_history
Description: Get PDMP data showing controlled substance dispensing history across all pharmacies. Args: patient_id: The patient's unique identifier Returns: PDMP records for controlled substance prescriptions
Input Schema:
Properties: Patient Id (Required)

Name: e-prescribing_get_prescription_status
Description: Get the lifecycle status of a specific prescription (sent, received, filled, picked_up, expired). Args: rx_id: The unique prescription identifier Returns: Prescription details including current status and lifecycle dates
Input Schema:
Properties: Rx Id (Required)

Name: e-prescribing_get_pharmacy_directory
Description: Search pharmacies by location, name, or type (retail, hospital, mail_order). Args: zip_code: Filter by ZIP code name: Filter by pharmacy name (partial match supported) type: Filter by pharmacy type (retail, hospital, mail_order) Returns: List of matching pharmacies
Input Schema:
Properties: Zip Code, Name, Type

Name: e-prescribing_check_formulary_status
Description: Check if a medication is covered, its tier, copay, and alternatives. Args: medication_name: Name of the medication to check (partial match supported) plan_id: Optional insurance plan ID to check against a specific plan Returns: Formulary coverage details including tier, copay, and any restrictions
Input Schema:
Properties: Medication Name (Required), Plan Id

Name: e-prescribing_get_medication_history
Description: Get full Surescripts-style medication history across all providers and pharmacies. Args: patient_id: The patient's unique identifier Returns: Complete medication history from all sources
Input Schema:
Properties: Patient Id (Required)

Name: e-prescribing_get_prescriptions
Description: Get prescriptions for a patient with optional status filter. Args: patient_id: The patient's unique identifier status: Filter by prescription status (e.g., 'filled', 'sent', 'expired', 'picked_up') Returns: List of prescriptions for the patient
Input Schema:
Properties: Patient Id (Required), Status

Name: lab-info-system_get_critical_results
Description: Get flagged critical/abnormal results needing immediate attention. Args: provider_id: Filter by ordering provider ID start_date: Filter results on or after this date (YYYY-MM-DD) end_date: Filter results on or before this date (YYYY-MM-DD) Returns: List of critical and abnormal results
Input Schema:
Properties: Provider Id, Start Date, End Date

Name: lab-info-system_get_pending_orders
Description: Get orders that are awaiting results. Args: provider_id: Filter by ordering provider ID department_id: Filter by department ID Returns: List of pending lab orders
Input Schema:
Properties: Provider Id, Department Id

Name: lab-info-system_search_test_catalog
Description: Search available lab tests and panels by name or category. Args: query: Search term to match against test name, panel name, or test code category: Filter by department/category (e.g., 'Chemistry', 'Hematology') Returns: List of matching tests from the catalog
Input Schema:
Properties: Query, Category

Name: lab-info-system_get_result_history
Description: Get historical results for a specific test to show trends over time. Args: patient_id: The patient's unique identifier test_name: The test name to retrieve history for (partial match supported) Returns: Chronological list of results for the specified test
Input Schema:
Properties: Patient Id (Required), Test Name (Required)

Name: lab-info-system_get_lab_results
Description: Get lab results for a patient with optional filters. Args: patient_id: The patient's unique identifier test_name: Filter by test name (partial match supported) start_date: Filter results on or after this date (YYYY-MM-DD) end_date: Filter results on or before this date (YYYY-MM-DD) abnormal_only: If True, only return abnormal/flagged results Returns: List of test results for the patient
Input Schema:
Properties: Patient Id (Required), Test Name, Start Date, End Date, Abnormal Only (Boolean)

Name: lab-info-system_get_order_details
Description: Get detailed information about a specific lab order including specimens and results. Args: order_id: The unique order identifier Returns: Order details with associated specimens and test results
Input Schema:
Properties: Order Id (Required)

Name: lab-info-system_get_lab_orders
Description: Get lab orders for a patient with optional status and date filters. Args: patient_id: The patient's unique identifier status: Filter by order status (e.g., 'completed', 'pending', 'in_progress') start_date: Filter orders on or after this date (YYYY-MM-DD) end_date: Filter orders on or before this date (YYYY-MM-DD) Returns: List of lab orders for the patient
Input Schema:
Properties: Patient Id (Required), Status, Start Date, End Date

Name: nccn-guidelines_extract_content
Description: Extract content from specific pages of a PDF file. Args: pdf_path: Path to the PDF file (relative to the downloads directory or absolute path) pages: Comma-separated page numbers to extract (e.g., "1,3,5-7"). If not specified, extracts all pages. Supports negative indexing (-1 for last page). Returns: Extracted text content from the specified pages
Input Schema:
Properties: Pdf Path (Required), Pages

Name: nccn-guidelines_download_pdf
Description: Download a PDF file from the specified URL, with optional NCCN login credentials. Args: url: The URL of the PDF file to download filename: Optional custom filename for the downloaded file username: Optional NCCN username/email for authentication (defaults to NCCN_USERNAME env var) password: Optional NCCN password for authentication (defaults to NCCN_PASSWORD env var) Returns: String indicating success/failure and the path to the downloaded file
Input Schema:
Properties: Url (Required)

Name: nccn-guidelines_get_index
Description: Get the raw contents of the NCCN guidelines index YAML file. Returns: String containing the raw YAML content of the guidelines index

Name: medical-billing-mcp_lookup_bundling
Description: Check if procedure codes are bundled together
Input Schema:
Properties: Codes (Array, Required)

Name: medical-billing-mcp_lookup_payer
Description: Look up payer-specific billing rules
Input Schema:
Properties: Payer (String, Required)

Name: medical-billing-mcp_lookup_denial
Description: Look up denial codes (CARC/RARC) with resolution steps
Input Schema:
Properties: Code (String), Search (String)

Name: medical-billing-mcp_lookup_modifier
Description: Look up billing modifier usage and documentation requirements
Input Schema:
Properties: Modifier (String, Required)

Name: medical-billing-mcp_lookup_cpt
Description: Look up CPT procedure codes by code or search term
Input Schema:
Properties: Code (String), Search (String)

Name: medical-billing-mcp_lookup_icd10
Description: Look up ICD-10 diagnosis codes by code or search term
Input Schema:
Properties: Code (String), Search (String)

Name: mcp-loinc_get_loinc_hierarchy
Description: Get the hierarchical relationships between LOINC terms. This tool retrieves the hierarchical relationships (parent-child) between LOINC terms. You can either get the children of a parent code or the parents of a child code. Args: parent_code: LOINC code to find children of child_code: LOINC code to find parents of max_depth: Maximum depth of hierarchy to return Returns: Dictionary containing hierarchical relationships
Input Schema:
Properties: Parent Code, Child Code, Max Depth (Integer, Default: 3)

Name: mcp-loinc_get_loinc_top2000
Description: Get the top 2000 most commonly used LOINC codes. This tool retrieves information about the most frequently used LOINC codes, which are valuable for healthcare IT implementations. Returns: Dictionary containing the top 2000 LOINC codes and their details

Name: mcp-loinc_search_loinc_forms
Description: Search for LOINC standardized forms and questionnaires. This tool searches for standardized assessment forms and questionnaires defined in LOINC, optionally including their component questions. Args: query: Search term for finding forms limit: Maximum number of results to return include_questions: Whether to include the questions in each form Returns: Dictionary containing matching forms and their details
Input Schema:
Properties: Query (String, Required), Limit (Integer), Include Questions (Boolean)

Name: mcp-loinc_get_loinc_panel
Description: Get information about a LOINC panel and its components. This tool retrieves information about a LOINC panel (a collection of related observations typically ordered together) and its component tests. Args: panel_code: The LOINC code of the panel (e.g., "24331-1" for lipid panel) panel_name: Name of the panel to search for (used if panel_code not provided) use_local_db: Whether to search in the local database first include_component_details: Whether to include details about each component Returns: Dictionary containing panel information and its components
Input Schema:
Properties: Panel Code, Panel Name, Use Local Db (Boolean), Include Component Details (Boolean)

Name: mcp-loinc_get_loinc_details
Description: Get detailed information about a specific LOINC code. This tool retrieves comprehensive details about a specific LOINC code, including its full attributes and optionally its associated answer list. Args: loinc_code: The LOINC code to get details for (e.g., "2339-0" for blood glucose) use_local_db: Whether to search in the local database first include_answer_list: Whether to include the associated answer list Returns: Dictionary containing details about the LOINC code
Input Schema:
Properties: Loinc Code (String, Required), Use Local Db (Boolean), Include Answer List (Boolean)

Name: mcp-loinc_search_loinc_codes
Description: Search for LOINC codes matching a query. This tool searches for LOINC codes that match the provided query. It can search in the local database first (if available) and fall back to the API, or go directly to the API based on the use_local_db parameter. Args: query: Search term for finding LOINC codes limit: Maximum number of results to return use_local_db: Whether to search in the local database first component_filter: Filter results by component (e.g., "Glucose") property_filter: Filter results by property (e.g., "Mass", "Presence") system_filter: Filter results by system (e.g., "Blood", "Serum") class_filter: Filter results by class (e.g., "PANEL", "SURVEY") include_details: Whether to include full details of each LOINC code Returns: Dictionary containing matching LOINC codes and their details
Input Schema:
Properties: Query (String, Required), Limit (Integer), Use Local Db (Boolean), Component Filter, Property Filter, System Filter, Class Filter, Include Details (Boolean)

Name: snomed-ct-mcp_snomed_lookup
Description: SNOMED CT Concept Lookup
Input Schema:
Properties: Snomed Domain (String)

Name: snomed-ct-mcp_snomed_get_by_code
Description: Fetch full details for a known SNOMED CT concept ID. Returns the preferred term, fully specified name, and all synonyms for the given concept code. Args: params (GetByCodeInput): - code (str): SNOMED CT numeric concept ID (e.g. '229070002') Returns: str: JSON with keys: query, results[], error

Name: snomed-ct-mcp_snomed_get_related
Description: Navigate the SNOMED CT hierarchy for a concept. Returns the concept's parents (immediate supertypes), children (immediate subtypes), and siblings (other children of the same parents). Useful for exploring broader, narrower, or alternative concepts. NOTE: This tool only walks the IS-A hierarchy. If the user asks for conceptually related concepts that may live in different branches or domains (e.g., 'quantifiable measures for X', 'procedures related to Y', 'assessment scales for Z'), use the 'explore_concept' prompt instead — it combines hierarchy navigation with targeted semantic searches. Args: params (GetRelatedInput): - code (str): SNOMED CT numeric concept ID (e.g. '229070002') Returns: str: JSON with keys: query, target, parents[], children[], siblings[], counts, error

Name: mcp-icd10_get_stats
Description: Database statistics: code counts per system and crosswalk mappings.

Name: who-mcp_who-health
Description: Unified tool for WHO Global Health Observatory operations: access health indicators, country statistics, and regional data via the modern OData API. Provides access to comprehensive health data from the World Health Organization covering topics like life expectancy, disease burden, health systems, and risk factors using standard OData query syntax.
Input Schema:
Properties: Method (String, Required), Dimension Code (String), Indicator Code (String), Keywords (String), Top (Integer), Filter (String), Country Code (String), Region Code (String), Year (String), Countries (String), Years (String), Sex (String)

Name: athenahealth_list_departments
Description: List all departments in the athenahealth practice. Returns all departments with their details including name, address, phone, specialty, and whether they're accepting new patients.

Name: athenahealth_list_providers
Description: List all healthcare providers in the practice. Args: name: Optional name filter (searches first, last, and scheduling name) specialty: Optional specialty filter limit: Maximum number of results (default 50) Returns providers with their details including name, specialty, NPI, department, and whether they're accepting new patients.
Input Schema:
Properties: Name, Specialty, Limit (Integer, Default: 50)

Name: athenahealth_check_appointment_availability
Description: Check available appointment slots. Args: department_id: Department ID (required) start_date: Start of date range in YYYY-MM-DD format (required) end_date: End of date range in YYYY-MM-DD format (required) provider_id: Filter by specific provider (optional) appointment_type: Filter by appointment type (optional) Returns available appointment slots with provider and department details.
Input Schema:
Properties: Department Id (String, Required), Start Date (String, Required), End Date (String, Required), Provider Id, Appointment Type

Name: athenahealth_check_drug_interactions
Description: Check for drug interactions among a list of medications. Args: medications: List of medication names to check for interactions Returns any known interactions between the medications, including: - Severity (major, moderate, minor) - Description of the interaction - Clinical effects - Management recommendations
Input Schema:
Properties: Medications (Array, Required)

Name: athenahealth_get_glucose_report
Description: Get the latest CGM glucose monitoring reports for a patient. Args: patient_id: The patient's ID Returns CGM summary data including average glucose, GMI (estimated A1c), time in range percentages, and any flagged concerns. Data comes from continuous glucose monitoring devices.
Input Schema:
Properties: Patient Id (String, Required)

Name: athenahealth_get_encounter
Description: Get details of a specific encounter. Args: encounter_id: The encounter ID Returns full encounter details including chief complaint, assessment, plan, and associated documentation.
Input Schema:
Properties: Encounter Id (String, Required)

Name: athenahealth_get_pharmacogenomics
Description: Get pharmacogenomic (drug-gene interaction) data for a patient. Args: patient_id: The patient's ID gene: Optional filter by gene name (e.g., "CYP2D6", "CYP2C19") drug: Optional filter by drug name (searches affected drugs) Returns metabolizer status for pharmacogenomic genes and how they affect drug metabolism, with clinical recommendations.
Input Schema:
Properties: Patient Id (String, Required), Gene, Drug

Name: athenahealth_get_health_risks
Description: Get genetic health risk predispositions for a patient. Args: patient_id: The patient's ID category: Optional filter - cardiovascular, metabolic, cancer, neurological, autoimmune risk_level: Optional filter - elevated, high, average, reduced Returns risk assessments based on genetic markers with recommended screenings.
Input Schema:
Properties: Patient Id (String, Required), Category, Risk Level

Name: athenahealth_get_carrier_status
Description: Get carrier status for recessive genetic conditions. Args: patient_id: The patient's ID Returns carrier screening results for conditions like cystic fibrosis, sickle cell disease, etc., relevant for family planning.
Input Schema:
Properties: Patient Id (String, Required)

Name: athenahealth_get_recommended_screenings
Description: Get recommended health screenings based on genetic risk profile. Args: patient_id: The patient's ID Returns personalized screening recommendations with priority levels and frequencies based on genetic risk assessments.
Input Schema:
Properties: Patient Id (String, Required)

Name: athenahealth_health_check
Description: Check the health status of the Athenahealth server. Returns server status, database connection status, and current user info.

Name: pubmed_get_pubmed_article_metadata
Description: Get PubMed Article Metadata
Input Schema:
Properties: Pmid (Required)

Name: pubmed_download_pubmed_pdf
Description: Download PubMed PDF
Input Schema:
Properties: Pmid (Required)

Name: pubmed_search_pubmed_advanced
Description: Search PubMed Advanced
Input Schema:
Properties: Term, Title, Author, Journal, Start Date, End Date, Num Results (Integer, Default: 10)

Name: pubmed_search_pubmed_key_words
Description: Search PubMed Keywords
Input Schema:
Properties: Key Words (String, Required), Num Results (Integer, Default: 10)

Name: npi-registry_search_npi_registry
Description: Search the National Provider Identifier (NPI) registry. The NPI registry contains information about healthcare providers and organizations in the United States. You can search by various criteria including name, NPI number, location, and specialty. WILDCARD SUPPORT: Most text fields support wildcard searches using '*' after at least 2 characters for fuzzy matching (e.g., 'smith*' matches 'Smith', 'Smithson', etc.)
Input Schema:
Properties: First Name, Last Name, Organization Name, Npi, City, State, Postal Code, Specialty, Limit (Integer, Default: 10)

Name: nexonco-mcp_search_clinical_evidence
Description: Perform a flexible search for clinical evidence using combinations of filters such as disease, therapy, molecular profile, phenotype, evidence type, and direction. This flexible search system allows you to tailor your query based on the data needed for research or clinical decision-making. It returns a detailed report that includes summary statistics, a top 10 evidence listing, citation sources, and a disclaimer.
Input Schema:
Properties: Disease Name, Therapy Name, Molecular Profile Name, Phenotype Name, Evidence Type, Evidence Direction, Filter Strong Evidence (Boolean, Default: false)

Name: medicaid-mcp_medicaid_info
Description: Unified tool for Medicaid data operations: access enrollment trends, drug pricing (NADAC), quality measures, and program performance from data.medicaid.gov via Socrata SODA API. Provides state-level aggregates (NOT provider-level like Medicare).
Input Schema:
Properties: Method (String, Required), State (String), States (Array), Ndc Code (String), Drug Name (String), Price Date (String), Start Date (String), End Date (String), Enrollment Type (String), Month (String), Ndc Codes (Array), Drug Names (Array), Labeler Name (String), Rebate Year (Integer), Dataset Id (String), Where Clause (String), Limit (Integer), Offset (Integer)

Name: healthcare-mcp_fda_drug_lookup
Description: Look up drug information from the FDA database
Input Schema:
Properties: Drug Name (String, Required), Search Type (String, Default: general)

Name: healthcare-mcp_medrxiv_search
Description: Search for pre-print articles on medRxiv
Input Schema:
Properties: Query (String, Required), Max Results (Number, Default: 10)

Name: healthcare-mcp_extract_dicom_metadata
Description: Extract metadata from a DICOM file
Input Schema:
Properties: File Path (String, Required)

Name: healthcare-mcp_ncbi_bookshelf_search
Description: Search the NCBI Bookshelf for biomedical books and documents
Input Schema:
Properties: Query (String, Required), Max Results (Number, Default: 10)

Name: healthcare-mcp_calculate_bmi
Description: Calculate Body Mass Index (BMI)
Input Schema:
Properties: Height Meters (Number, Required), Weight Kg (Number, Required)

Name: healthcare-mcp_clinical_trials_search
Description: Search for clinical trials by condition, status, and other parameters
Input Schema:
Properties: Condition (String, Required), Status (String, Default: recruiting), Max Results (Number, Default: 10)

Name: healthcare-mcp_get_usage_stats
Description: Get usage statistics for the current session

Name: healthcare-mcp_get_all_usage_stats
Description: Get overall usage statistics for all sessions

Name: dicom-mcp_list_dicom_nodes
Description: List all configured DICOM nodes and their connection information. This tool returns information about all configured DICOM nodes in the system and shows which node is currently selected for operations. It also provides information about available calling AE titles.

Name: dicom-mcp_extract_pdf_text_from_dicom
Description: Retrieve a DICOM instance with encapsulated PDF and extract its text content. This tool retrieves a DICOM instance containing an encapsulated PDF document, extracts the PDF, and converts it to text. This is particularly useful for medical reports stored as PDFs within DICOM format (e.g., radiology reports, clinical documents).
Input Schema:
Properties: Study Instance Uid (String, Required), Series Instance Uid (String, Required), Sop Instance Uid (String, Required)

Name: dicom-mcp_switch_dicom_node
Description: Switch the active DICOM node connection to a different configured node. This tool changes which DICOM node (PACS, workstation, etc.) subsequent operations will connect to. The node must be defined in the configuration file.
Input Schema:
Properties: Node Name (String, Required)

Name: dicom-mcp_verify_connection
Description: Verify connectivity to the current DICOM node using C-ECHO. This tool performs a DICOM C-ECHO operation (similar to a network ping) to check if the currently selected DICOM node is reachable and responds correctly. This is useful to troubleshoot connection issues before attempting other operations.

Name: dicom-mcp_query_patients
Description: Query patients matching the specified criteria from the DICOM node. This tool performs a DICOM C-FIND operation at the PATIENT level to find patients matching the provided search criteria. All search parameters are optional and can be combined for more specific queries.
Input Schema:
Properties: Name Pattern (String), Patient Id (String), Birth Date (String), Attribute Preset (String, Default: standard), Additional Attributes (Array), Exclude Attributes (Array)

Name: dicom-mcp_query_studies
Description: Query studies matching the specified criteria from the DICOM node. This tool performs a DICOM C-FIND operation at the STUDY level to find studies matching the provided search criteria. All search parameters are optional and can be combined for more specific queries.
Input Schema:
Properties: Patient Id (String), Study Date (String), Modality In Study (String), Study Description (String), Accession Number (String), Study Instance Uid (String), Attribute Preset (String, Default: standard), Additional Attributes (Array), Exclude Attributes (Array)

Name: dicom-mcp_query_series
Description: Query series within a study from the DICOM node. This tool performs a DICOM C-FIND operation at the SERIES level to find series within a specified study. The study_instance_uid is required, and additional parameters can be used to filter the results.
Input Schema:
Properties: Study Instance Uid (String, Required), Modality (String), Series Number (String), Series Description (String), Series Instance Uid (String), Attribute Preset (String, Default: standard), Additional Attributes (Array), Exclude Attributes (Array)

Name: dicom-mcp_move_study
Description: Move a DICOM study to another DICOM node. This tool transfers an entire study from the current DICOM server to a destination DICOM node.
Input Schema:
Properties: Destination Node (String, Required), Study Instance Uid (String, Required)

Name: dicom-mcp_move_series
Description: Move a DICOM series to another DICOM node. This tool transfers a specific series from the current DICOM server to a destination DICOM node.
Input Schema:
Properties: Destination Node (String, Required), Series Instance Uid (String, Required)

Name: dicom-mcp_query_instances
Description: Query individual DICOM instances (images) within a series. This tool performs a DICOM C-FIND operation at the IMAGE level to find individual DICOM instances within a specified series. The series_instance_uid is required, and additional parameters can be used to filter the results.
Input Schema:
Properties: Series Instance Uid (String, Required), Instance Number (String), Sop Instance Uid (String), Attribute Preset (String, Default: standard), Additional Attributes (Array), Exclude Attributes (Array)

Name: dicom-mcp_get_attribute_presets
Description: Get all available attribute presets for DICOM queries. This tool returns the defined attribute presets that can be used with the query_* functions. It shows which DICOM attributes are included in each preset (minimal, standard, extended) for each query level.

Name: clinicaltrialsgov-mcp-server_clinicaltrials_get_study
Description: Fetches one or more clinical studies from ClinicalTrials.gov by their NCT IDs. Returns either complete study data or concise summaries for each.
Input Schema:
Properties: Nct Ids (Required), Markup Format (String, Default: markdown), Fields (Array), Summary Only (Boolean, Default: false)

Name: calculator_calculate
Description: Calculates/evaluates the given expression.
Input Schema:
Properties: Expression (String, Required)

Name: brave-search_brave_web_search
Description: Performs a web search using the Brave Search API, ideal for general queries, news, articles, and online content. Use this for broad information gathering, recent events, or when you need diverse web sources. Supports pagination, content filtering, and freshness controls. Maximum 20 results per request, with offset for pagination.
Input Schema:
Properties: Query (String, Required), Count (Number, Default: 10), Offset (Number, Default: 0)

Name: brave-search_brave_local_search
Description: Searches for local businesses and places using Brave's Local Search API. Best for queries related to physical locations, businesses, restaurants, services, etc. Returns detailed information including: - Business names and addresses - Ratings and review counts - Phone numbers and opening hours Use this when the query implies 'near me' or mentions specific locations. Automatically falls back to web search if no local results are found.
Input Schema:
Properties: Query (String, Required), Count (Number, Default: 5)
`;

// Helper: Gemini API Fetch with Exponential Backoff
const fetchGemini = async (prompt, systemInstruction = "You are a helpful assistant.") => {
  const apiKey = ""; // API Key provided by environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
};

// Helper component for parameter pills (Hovering displays type/default/status)
const ParamPill = ({ param }) => (
  <div className="relative group inline-block mr-2 mb-2">
    <div className={`
      px-3 py-1 rounded-full border text-xs cursor-help transition-colors
      ${param.required 
        ? 'border-slate-500 text-slate-100 font-bold bg-[#111]' 
        : 'border-slate-700 text-slate-400 font-normal bg-slate-900'}
    `}>
      {param.name}
    </div>
    
    {/* Tooltip Overlay */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[220px] bg-slate-800 text-slate-200 text-xs rounded-md p-2.5 shadow-xl border border-slate-700 z-50">
      <div className="font-bold text-slate-100 mb-1">{param.name}</div>
      {param.type && param.type !== 'Unknown' && (
        <div className="text-slate-400 mt-1">
          Type: <span className="text-slate-300 font-mono ml-1">{param.type}</span>
        </div>
      )}
      {param.default && (
        <div className="text-slate-400 mt-0.5">
          Default: <span className="text-slate-300 font-mono ml-1">{param.default}</span>
        </div>
      )}
      <div className="text-slate-400 mt-1">
        Status: <span className={param.required ? "text-rose-400 ml-1 font-medium" : "text-emerald-400 ml-1 font-medium"}>
          {param.required ? 'Required' : 'Optional'}
        </span>
      </div>
      
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
    </div>
  </div>
);

export default function App() {
  const [tools, setTools] = useState([]);
  const [selectedServer, setSelectedServer] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTool, setExpandedTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Gemini State for Mock Data Generator
  const [mockPayloads, setMockPayloads] = useState({});

  // Gemini State for AI Workflow Assistant
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Parse the raw text payload into structured tool objects
  useEffect(() => {
    const parseTools = () => {
      const parsedTools = [];
      const blocks = RAW_TEXT.split('Name:').filter(b => b.trim());

      blocks.forEach(block => {
        const lines = block.split('\n');
        const name = lines[0].trim();
        if (!name) return;

        let description = '';
        let inputSchemaStr = '';
        let parameters = [];
        let isDesc = false;
        let isSchema = false;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('Description:')) {
            isDesc = true;
            isSchema = false;
            description += line.replace('Description:', '').trim() + ' ';
            continue;
          }
          if (line.startsWith('Input Schema:')) {
            isDesc = false;
            isSchema = true;
            continue;
          }

          if (isDesc && !line.startsWith('Properties:')) {
            description += line + ' ';
          } else if (isSchema && line) {
            inputSchemaStr += line + '\n';
          }

          if (line.startsWith('Properties:')) {
            const propsStr = line.replace('Properties:', '').trim();
            if (propsStr) {
              const regex = /,\s*(?![^()]*\))/g;
              const propsList = propsStr.split(regex);
              
              propsList.forEach(p => {
                const cleanP = p.trim();
                const match = cleanP.match(/^([^(]+)(?:\(([^)]+)\))?$/);
                if (match) {
                  const paramName = match[1].trim();
                  const details = match[2] ? match[2].trim() : '';
                  
                  let isRequired = false;
                  let type = 'Unknown';
                  let def = '';
                  
                  if (details) {
                    const detailParts = details.split(',').map(d => d.trim());
                    detailParts.forEach(dp => {
                      if (dp.toLowerCase() === 'required') {
                        isRequired = true;
                      } else if (dp.toLowerCase().startsWith('default:')) {
                        def = dp.substring(8).trim();
                      } else if (type === 'Unknown') {
                        type = dp;
                      }
                    });
                  }
                  
                  parameters.push({ 
                    name: paramName, 
                    required: isRequired, 
                    type, 
                    default: def 
                  });
                }
              });
            }
          }
        }

        let assignedServer = '';
        for (const s of SERVER_ORDER) {
          if (name.startsWith(s.id)) {
            assignedServer = s.id;
            break;
          }
        }
        if (!assignedServer) {
          assignedServer = name.split('_')[0];
        }

        parsedTools.push({
          id: name,
          name: name.replace(`${assignedServer}_`, ''), 
          server: assignedServer,
          description: description.trim(),
          schema: inputSchemaStr.trim(),
          parameters
        });
      });

      setTools(parsedTools);
    };

    parseTools();
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesServer = selectedServer === 'all' ? true : tool.server === selectedServer;
      return matchesSearch && matchesServer;
    });
  }, [tools, searchQuery, selectedServer]);

  const serverStats = useMemo(() => {
    const stats = {};
    tools.forEach(t => {
      stats[t.server] = (stats[t.server] || 0) + 1;
    });
    return stats;
  }, [tools]);

  const activeServerData = selectedServer === 'all' 
    ? { label: 'All Servers' } 
    : SERVER_ORDER.find(s => s.id === selectedServer);

  // ✨ Gemini Feature: Generate Mock Payload
  const handleGeneratePayload = async (tool) => {
    setMockPayloads(prev => ({ ...prev, [tool.id]: { loading: true } }));
    
    const systemPrompt = `You are a clinical data engineer. Given a tool name, description, and input schema, generate a valid, realistic JSON payload of mock medical data that would be sent to this API. Do NOT wrap the JSON in markdown code blocks (\`\`\`json). Output raw, unescaped JSON only. Make it pretty-printed.`;
    const userPrompt = `Tool Name: ${tool.id}\nDescription: ${tool.description}\nSchema:\n${tool.schema}`;

    try {
      let result = await fetchGemini(userPrompt, systemPrompt);
      // Clean up markdown blocks if Gemini accidentally includes them
      result = result.replace(/^```(json)?/m, '').replace(/```$/m, '').trim();
      setMockPayloads(prev => ({ ...prev, [tool.id]: { loading: false, data: result } }));
    } catch (error) {
      setMockPayloads(prev => ({ ...prev, [tool.id]: { loading: false, error: 'Failed to generate example.' } }));
    }
  };

  // ✨ Gemini Feature: Clinical Workflow Assistant
  const handleAssistantQuery = async (e) => {
    e.preventDefault();
    if (!assistantQuery.trim()) return;

    setAssistantLoading(true);
    setAssistantResponse('');

    const systemInstruction = `You are an expert clinical integration assistant. You help developers and clinicians figure out WHICH Model Context Protocol (MCP) tools they should combine to complete a specific workflow.
You have access to a catalog of 130 tools across servers like Athenahealth, DICOM, Epic/Medicaid, ClinicalTrials, etc.
When the user gives a scenario, respond with a concise, bulleted workflow. Mention the exact tool IDs (bold them) and briefly explain why. End with a friendly, professional closing.`;

    // To prevent token explosion, send a summarized catalog
    const catalogSummary = tools.map(t => `- ID: ${t.id} | Desc: ${t.description.substring(0, 150)}`).join('\n');
    const userPrompt = `Available Tools Catalog:\n${catalogSummary}\n\nUser Scenario: ${assistantQuery}`;

    try {
      const response = await fetchGemini(userPrompt, systemInstruction);
      setAssistantResponse(response);
    } catch (error) {
      setAssistantResponse('Sorry, there was an error processing your request. Please try again.');
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Assistant Modal Overlay */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAssistantOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Clinical Workflow Assistant</h3>
              </div>
              <button onClick={() => setIsAssistantOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/50">
              {!assistantResponse && !assistantLoading ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Describe a clinical task or scenario, and I will recommend the right tools to use.</p>
                  <p className="text-sm">Example: "I need to check a patient's genetic risks and then refer them to a cardiologist."</p>
                </div>
              ) : assistantLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse">Analyzing tool catalog...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {assistantResponse.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('-') ? 'ml-4' : ''}>
                      {line.includes('**') ? (
                         <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600 dark:text-indigo-400">$1</strong>') }} />
                      ) : line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAssistantQuery} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  placeholder="Ask for a tool workflow recommendation..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={assistantLoading}
                />
                <button 
                  type="submit" 
                  disabled={assistantLoading || !assistantQuery.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Suggest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar - Servers List */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">MCP Explorer</h1>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Connected Servers ({SERVER_ORDER.length})
          </div>
          <nav className="space-y-0.5 px-2">
            
            <button
              onClick={() => {
                setSelectedServer('all');
                setSearchQuery('');
                setSidebarOpen(false);
                setExpandedTool(null);
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-2
                ${selectedServer === 'all' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm border border-indigo-100 dark:border-indigo-800/50' 
                  : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <Layers className={`w-4 h-4 shrink-0 ${selectedServer === 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate">All Servers</span>
              </div>
              <span className={`
                shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
                ${selectedServer === 'all' ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
              `}>
                {tools.length}
              </span>
            </button>

            {SERVER_ORDER.map((server) => {
              const isActive = selectedServer === server.id;
              const actualCount = serverStats[server.id] || 0;
              const Icon = server.icon || Database;
              
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(server.id);
                    setSearchQuery('');
                    setSidebarOpen(false);
                    setExpandedTool(null);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{server.label}</span>
                  </div>
                  <span className={`
                    shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                    ${isActive ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                  `}>
                    {actualCount} / {server.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4 justify-between">
          <div className="flex items-center flex-1 gap-4 max-w-2xl">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder={`Search tools in ${activeServerData?.label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Server Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  {activeServerData?.label}
                </h2>
                {selectedServer !== 'all' && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Server ID: <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-xs">{selectedServer}</code>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <Wrench className="w-4 h-4" />
                <span className="font-medium text-slate-900 dark:text-white">{filteredTools.length}</span> tools available
              </div>
            </div>

            {/* Tools List */}
            {filteredTools.length > 0 ? (
              <div className="space-y-4 pb-32">
                {filteredTools.map((tool) => (
                  <div 
                    key={tool.id} 
                    className={`
                      bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200
                      ${expandedTool === tool.id ? 'border-indigo-300 dark:border-indigo-600 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}
                    `}
                  >
                    {/* Tool Header */}
                    <button 
                      onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                      className={`
                        w-full text-left px-5 py-4 flex items-start justify-between gap-4 focus:outline-none 
                        ${expandedTool === tool.id ? 'rounded-t-xl' : 'rounded-xl'}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate text-slate-900 dark:text-slate-100">
                            {tool.name}
                          </h3>
                          {tool.parameters.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                              Requires Params
                            </span>
                          )}
                        </div>
                        <p className={`text-sm text-slate-500 dark:text-slate-400 ${expandedTool === tool.id ? '' : 'line-clamp-2'}`}>
                          {tool.description}
                        </p>
                      </div>
                      <div className="shrink-0 mt-1 text-slate-400 dark:text-slate-500">
                        {expandedTool === tool.id ? (
                          <ChevronUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details Area */}
                    {expandedTool === tool.id && (
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pt-4 rounded-b-xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Col: Info & Parameters */}
                          <div className="flex flex-col gap-6">
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> General Info
                              </h4>
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm">
                                <div className="mb-2">
                                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Full Identifier</span>
                                  <code className="text-slate-800 dark:text-slate-200 font-mono text-[13px]">{tool.id}</code>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Parent Server</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-[13px]">{tool.server}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                               <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Parameters Info
                              </h4>
                              <div className="bg-[#1a1c23] rounded-lg p-4 shadow-inner">
                                {tool.parameters && tool.parameters.length > 0 ? (
                                  <div>
                                    {tool.parameters.filter(p => p.required).length > 0 && (
                                      <div className="mb-4">
                                        <div className="text-slate-300 text-[13px] mb-2 font-medium">Required Parameters:</div>
                                        <div className="flex flex-wrap">
                                          {tool.parameters.filter(p => p.required).map(p => (
                                            <ParamPill key={p.name} param={p} />
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {tool.parameters.filter(p => !p.required).length > 0 && (
                                      <div>
                                        <div className="text-slate-400 text-[13px] mb-2 font-medium mt-1">Optional Parameters:</div>
                                        <div className="flex flex-wrap">
                                          {tool.parameters.filter(p => !p.required).map(p => (
                                            <ParamPill key={p.name} param={p} />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-500 text-xs font-mono italic flex items-center py-2">
                                    No specific input parameters required.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Col: Schema & Mock Generator */}
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5" /> Input Schema
                              </h4>
                            </div>
                            
                            <div className="bg-slate-900 rounded-lg overflow-hidden shadow-inner flex flex-col h-full min-h-[200px]">
                              {/* Original Schema View */}
                              <div className={`p-3 overflow-x-auto ${mockPayloads[tool.id]?.data ? 'max-h-40 border-b border-slate-700/50' : 'flex-1'}`}>
                                {tool.schema ? (
                                  <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed h-full">
                                    {tool.schema.replace('Properties: ', '{\n  ').replace(/,/g, ',\n  ') + (tool.schema.includes('Properties:') ? '\n}' : '')}
                                  </pre>
                                ) : (
                                  <div className="text-slate-500 text-xs font-mono italic h-full flex items-center">
                                    No schema definition provided.
                                  </div>
                                )}
                              </div>
                              
                              {/* Generated AI Mock Data View */}
                              {mockPayloads[tool.id]?.data && (
                                <div className="p-3 bg-[#111] flex-1 overflow-y-auto border-t border-indigo-500/30 relative">
                                  <div className="absolute top-2 right-2 text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> AI Generated
                                  </div>
                                  <pre className="text-indigo-300 font-mono text-xs pt-4 whitespace-pre-wrap">
                                    {mockPayloads[tool.id].data}
                                  </pre>
                                </div>
                              )}
                              {mockPayloads[tool.id]?.error && (
                                <div className="p-3 bg-red-950/30 border-t border-red-500/30 text-red-400 text-xs text-center flex-1">
                                  {mockPayloads[tool.id].error}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-dashed">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">No tools found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Try adjusting your search or selecting a different server.
                </p>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
import LocalizedStrings from 'react-native-localization'
import { studentLimitSaveInLocal } from './CommonUtils'
export default strings = new LocalizedStrings({
    en: {
        title_saralapp:'Saral Scan App',
        cancel_text_caps: 'CANCEL',
        cancel_text: 'Cancel',
        ok_text: 'Ok',
        submit_text: 'SUBMIT',
        Save:'SAVE',
        Back :'Back',
        close:'Close',
        get_start: 'GET STARTED',
        permission_deny: 'Permission Deny',
        you_have_no_permission_to_change_settings: 'You have no permission to change settings',
        open_settings: 'Open Settings',
        something_went_wrong_please_try_again: 'Something went wrong, Please try again.',
        message_text: 'Message',
        table_image_is_not_proper: 'Table image is not proper. Please try again.',
        saved_successfully: 'Saved Successfully',
        please_try_again: 'Please try again.',
        request_timeout_custom_message : "Request timed out. Please check your internet connection and retry.",
        you_seem_to_be_offline_please_check_your_internet_connection: 'Please check your internet connection.',
        please_select_at_least_one_student : 'at least one ID should be there',
        yes_text: 'Yes',
        no_text: 'No',
        version_text: 'Version',
        page_no:'Page Number',
        Record_no:'Record Number',
        skip:'Skip',
        give_permission_from_settings: 'Please give permission from Settings to use app',
        optional_update_available: 'A new update is available of App. Do you want to update now?',
        force_update_available: 'We have an updated version for you. Please Update to continue using App.',
        you_can_save_only_limited_student_In_Order_to_continue_have_to_save_first:`You can Save Only ${studentLimitSaveInLocal} ID. In Order to Continue have to save first`,
        no_btn_text: 'No',
        yes_btn_text: 'Yes',
        complete_these_steps_submit_marks: 'complete these steps to submits marks',
        please_select_exam_taken_at: 'Please Select Exam Taken At',
        please_fill_cells: "Please Fill  cells",
        test_id:'Test_ID',
        scan_status: 'Scan Status',
        save_status: 'Save Status',
        continue_scan:'Continue Scan',
        ongoing_scan: 'Ongoing Scan',
        save_scan:'Save All Scan',
        scan_text: 'Scan',
        permission_text: 'Permission',
        app_needs_permission: 'SaralData app needs access to your camera and storage',
        please_give_permission_to_use_app: 'Please give permission to use app',
        please_wait: 'Please wait...',
        student_roll: 'Roll No.',
        please_correct_student_roll: 'Please correct the Roll No.',
        omr_mark_should_be: 'Omr mark should be 1 or 0',
        login_text: 'Login',
        up_saralData: 'UP Saraldata',
        schoolId_text: 'School Id',
        userId_text: 'User ID',
        password_text: 'Password',
        schoolid_password_doesnot_match: 'School Id or Password does not match',
        subject:'Subject',
        school_name: 'School',
        logout_text: 'Logout',
        are_you_sure_you_want_to_logout: 'Are you sure you want to logout?',
        please_select_below_details: 'Please select below details',
        select_text: 'Select',
        class_text: 'Class',
        section: 'Section',
        exam_sub: 'Exam Subject',
        exam_details:"Exam Details",
        details:"Details",
        Exam_Type:'Exam Type',
        exam_sub_date: 'Exam Subject - Date',
        exam_id: 'Exam Id',
        Exam:'Exam',
        next_text: 'next',
        student_details: 'Student Details',
        exam_taken_at: 'exam taken at',
        exam_date: 'Exam Date',
        test_date: 'Test Date',
        please_select_valid_section: 'Please select valid Option',
        please_select_class: 'Please select valid Option',
        please_select_section: 'Please select Section',
        please_select_date: 'Please select Date',
        please_select_sub: 'Please select valid Option',
        total_marks: 'Total Marks',
        total_marks_secured: 'Total marks secured',
        summary_scanned_data: 'Scanned data summary',
        edit_text: 'Edit',
        save_text: 'Save',
        summary_text: 'Summary',
        student_id: 'Student ID',
        please_correct_student_id: 'please correct ID',
        please_correct_marks_data: 'Please edit and correct result data.',
        student_roll_length_error: 'RollNo. should be 7 digit',
        sat_string: 'SAT',
        pat_string: 'PAT',
        backToDashboard:'Dashboard',
        contactAdmin:'Something went wrong , contact Admin',
        student_cant_be_mark_as_absent_once_scanned:"can't be mark as absent once scanned !",
        shareDataExceed:'Data limit exceeded,Extract from backend',
        auto_sync_in_progress_please_wait: 'Auto-Sync Is In Progress, Please wait',
        auto_sync_completed: 'Auto-Sync Completed',
        saral_app_auto_sync_channel: 'saral-app-auto-sync-channel',
        back: 'BACK',
        student_id_should_be_same: 'ID should be same',
        Student_ID_Shouldnt_be_duplicated : "ID Shouldn't be duplicated",
        Sum_Of_All_obtained_marks: "Sum Of All obtained result should be equal to result Obtained",
        process_failed_try_again : 'Process failed try again later ',
        there_is_no_data: 'There is no data!',
        help_menu: 'Help',
        about_menu: 'About',
        ok_button: "OK",
        cancel_button: 'Cancel',
        error_message: "Error",
        add_new_tag: "Add New Tag",
        add_tag: 'Add Tag',
        StudentId_limit_exceeds:"Id exceeds the limit",
        absent_status: 'Absent Status',
        student_id_should_not_blank: "Id Shouldn't be blank",
        save_all_scan: 'Save All Scan',
        please_select_roi_layout: "Please select layout",
        minimal_mode: "Minimal Mode",
        regular_mode: "Regular Mode",
        saved_data: "Saved Data",
        scan_data: "Scan Data",
        scan_count: "Scan Count",
        save_count: "Save Count",
        clear_local_cache: "Clear User Cache",
        clear_global_cache: "Clear All User Cache",
        are_you_sure_you_want_to_clear_local_cache: "Are you sure you want to clear local cache ?",
        are_you_sure_you_want_to_clear_global_cache: "Are you sure you want to clear global cache ?",
        you_dont_have_cache: "You don't have cache",
        please_try_again_later_network_is_not_available: "Please try again later network isn't available",
        roi_cache_not_available: "Roi cache not available",
        set_text:'Paper Set',
        you_dont_have_cache_for_save_count: "You don't have cache for save count",
        lock_screen: "State/District/School is locked for scanning" ,
        Mark_Absent:"Mark as Absent",
        Mark_Present:"Mark as Present",
        Saral:"Saral",
        Registred_Mob_No:'Registered Mobile Number',
        Summary_page : 'Summary Page',
        Digit_model_is_not_availaible: "Digit model is not availaible",
        Alpha_numeric_model_is_not_availaible: "Alpha numeric model is not availaible"
    }
})
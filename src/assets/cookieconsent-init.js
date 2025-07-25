window.addEventListener('load', function(){
    var cc = initCookieConsent();

    cc.run({
        current_lang: 'en',
        page_scripts: true,
        languages: {
            'en': {
                consent_modal: {
                    title: 'Analytical Cookies',
                    description: 'Analytical cookies help us to improve our website by collecting and reporting information on its usage.',
                    primary_btn: {
                        text: 'Accept',
                        role: 'accept_all'
                    },
                    secondary_btn: {
                        text: 'Reject',
                        role: 'accept_necessary'
                    }
                },
                settings_modal: {
                    title: 'Cookie preferences',
                    save_settings_btn: 'Save',
                    accept_all_btn: 'Accept',
                    reject_all_btn: 'Reject',
                    close_btn_label: 'Close',
                    cookie_table_headers: [],
                    blocks: [
                        {
                            title: 'Analytical Cookies',
                            description: 'Analytical cookies help us to improve our website by collecting and reporting information on its usage.',
                            toggle: {
                                value: 'analytics',
                                enabled: true,
                                readonly: false
                            }
                        }
                    ]
                }
            }
        }
    });
});

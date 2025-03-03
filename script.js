document.getElementById('passwordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const birthdate = document.getElementById('birthdate').value;
    const code = document.getElementById('code').value;
    
    if (birthdate.length !== 8 || code.length !== 4) {
        alert('Proszę wprowadzić poprawną datę urodzenia (RRRRMMDD) i kod weryfikujący (4 cyfry).');
        return;
    }
    
    let password = '';
    for (let i = 0; i < code.length; i++) {
        const index = parseInt(code[i]) - 1;
        if (index >= 0 && index < birthdate.length) {
            password += birthdate[index];
        }
    }
    
    document.getElementById('result').innerText = 'Wygenerowane hasło: ' + password;
});
// LIFF ID ของคุณ (2008162847-jMMzgOn1)
const liffId = '2008162847-jMMzgOn1';
let myUserId = '';
let myName = ''; // เก็บชื่อผู้ใช้ที่ล็อกอิน
let myPictureUrl = '';

// URL ของ Backend API ของคุณ
const apiBaseUrl = 'https://website-degree-bn.onrender.com';
//const apiBaseUrl = 'http://localhost:5000';

// อัปเดตสถานะในหน้าเว็บ
function updateStatus(elementId, message, color = 'black') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = color;
    }
}

// ===================================
// NEW: ฟังก์ชันแสดงกำหนดการ (Schedule)
// ===================================
function displaySchedule(dateValue) {
    const scheduleDisplay = document.getElementById('schedule-display');
    const arrivalTimeGroup = document.getElementById('arrival-time-group');
    let title = '';
    let content = '';

    if (dateValue === '3-oct') {
        title = '🗓️ กำหนดการวันซ้อม (3 ตุลาคม) - ณ มหาวิทยาลัย';
        content = `
            <p><span class="time-slot">07:00 - 10:45 น.</span> ฝึกซ้อมย่อย/ถ่ายรูป</p>
            <p><span class="time-slot">11:30 - 13:30 น.</span> ฝึกซ้อมรับปริญญาบัตรบนเวที</p>
            <p><span class="time-slot">14:00 - 20:00 น.</span> ฝึกซ้อมใหญ่</p>
            <p style="margin-top:10px; font-weight:600; color:#c62828;">* แนะนำให้มาในช่วงบ่ายเป็นต้นไปครับ</p>
        `;
        scheduleDisplay.style.display = 'block';
        arrivalTimeGroup.style.display = 'block';
    } else if (dateValue === '7-oct') {
        title = '🎓 กำหนดการวันจริง (7 ตุลาคม) - ณ หอประชุม';
        content = `
            <p><span class="time-slot">08:00 - 11:00 น.</span> ลงทะเบียน/ถ่ายภาพหมู่/เตรียมตัว</p>
            <p><span class="time-slot">11:00 น. เป็นต้นไป</span> พิธีพระราชทานปริญญาบัตร</p>
            <p style="margin-top:10px; font-weight:600; color:#c62828;">* โปรดมาถึงก่อน 10:30 น. เพื่อถ่ายรูปร่วมกันและอำนวยความสะดวกในการเข้าหอประชุม</p>
        `;
        scheduleDisplay.style.display = 'block';
        arrivalTimeGroup.style.display = 'block';
    } else {
        scheduleDisplay.style.display = 'none';
        arrivalTimeGroup.style.display = 'none';
        document.getElementById('arrival_time').removeAttribute('required'); // ลบ required เมื่อไม่ได้เลือกวัน
        return;
    }

    // กำหนด required เมื่อเลือกวัน
    document.getElementById('arrival_time').setAttribute('required', 'required');

    scheduleDisplay.innerHTML = `
        <h3>${title}</h3>
        ${content}
    `;
}

// -----------------------------------
// Event Listener สำหรับการเลือกวัน
// -----------------------------------
document.getElementById('date').addEventListener('change', (event) => {
    displaySchedule(event.target.value);
});


// ฟังก์ชันหลัก: เริ่มต้น LIFF และล็อกอิน
async function initializeLiff() {
    try {
        console.log('Initializing LIFF with ID:', liffId);
        
        // 1. เริ่มต้น LIFF
        await liff.init({ liffId: liffId });
        console.log('LIFF initialized successfully');

        // 2. ตรวจสอบสถานะการล็อกอิน
        if (!liff.isLoggedIn()) {
            console.log('User not logged in, redirecting to login...');
            liff.login();
        } else {
            console.log('User is logged in, getting profile...');
            
            // 3. ดึง Profile
            const profile = await liff.getProfile();
            myUserId = profile.userId;
            myName = profile.displayName;
            myPictureUrl = profile.pictureUrl;

            // แสดงข้อมูลผู้ใช้ที่ล็อกอินแล้ว
            document.getElementById('login-message').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-name').textContent = myName;

            // 4. โหลดข้อมูลที่ลงทะเบียนไว้
            loadMyGuests(myName);
            
            // 5. ตั้งค่า Listener สำหรับฟอร์ม
            document.getElementById('registration-form').addEventListener('submit', handleFormSubmit);
        }
    } catch (err) {
        console.error('LIFF Initialization failed:', err);
        updateStatus('login-message', `❌ การเชื่อมต่อ LIFF ล้มเหลว: ${err.message}`, 'red');
    }
}

// ===================================
// ฟังก์ชันจัดการการส่งฟอร์ม (Submit)
// ===================================
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // อัปเดตสถานะปุ่ม
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = '⏳ กำลังบันทึก...';
    submitBtn.disabled = true;

    const form = event.target;
    const formData = new FormData(form);
    
    // สร้าง Payload
    const payload = {
        line_user_id: myUserId, // ใช้ LINE User ID ของคนลงทะเบียน
        host_name: myName, // ใช้ชื่อผู้ใช้ LINE ที่ล็อกอินมาเป็นคนลงทะเบียน
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        // REMOVED: ลบ dob ออก
        phone: formData.get('phone'),
        date: formData.get('date'),
        arrival_time: formData.get('arrival_time') // NEW: เพิ่มเวลาที่คาดว่าจะมาถึง
    };

    console.log('Submitting Payload:', payload);

    try {
        const response = await fetch(`${apiBaseUrl}/api/guests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert('ลงทะเบียนสำเร็จแล้ว! ขอบคุณที่มาเจอกันนะครับ/คะ 😊');
            form.reset();
            displaySchedule(''); // เคลียร์หน้าจอแสดงกำหนดการ
            loadMyGuests(myName); // โหลดรายการแขกของตัวเองใหม่
        } else {
            const errorData = await response.json();
            alert(`ลงทะเบียนไม่สำเร็จ: ${errorData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'}`);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
    } finally {
        submitBtn.textContent = 'ลงทะเบียน (มาเจอกันนะ!)';
        submitBtn.disabled = false;
    }
}

// ===================================
// ฟังก์ชันโหลดข้อมูลแขกของตัวเอง
// ===================================
async function loadMyGuests(hostName) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/guests/by-host/${hostName}`);
        const guests = await response.json();
        
        const guestListElement = document.getElementById('guestList');
        guestListElement.innerHTML = ''; // Clear current list

        if (guests.length === 0) {
            guestListElement.innerHTML = '<li class="guest-item" style="justify-content: center; font-style: italic; color:#777;">ยังไม่มีการลงทะเบียนจากคุณเลยครับ/ค่ะ</li>';
            return;
        }

        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            // ปรับการแสดงผล: เพิ่มเวลาที่คาดว่าจะมาถึง
            const dateText = guest.date === '3-oct' ? 'วันซ้อม (3 ต.ค.)' : 'วันจริง (7 ต.ค.)';
            const arrivalTimeText = guest.arrival_time ? ` | ⏱️ ${guest.arrival_time}` : ''; 
            
            listItem.innerHTML = `
                <span>
                    <strong>${guest.first_name} ${guest.last_name}</strong>
                    <small style="display: block; color: #8e24aa; font-weight: 600;">${dateText} ${arrivalTimeText}</small>
                    ${guest.phone ? `<small style="display: block; color: #666;">📞 ${guest.phone}</small>` : ''}
                </span>
                <button class="delete-btn" onclick="deleteGuest('${guest.id}', '${guest.first_name} ${guest.last_name}')">ลบ</button>
            `;
            guestListElement.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching my guests:', error);
        document.getElementById('guestList').innerHTML = '<li class="guest-item" style="justify-content: center; color:red; font-style: italic;">❌ ดึงข้อมูลไม่สำเร็จ</li>';
    }
}

// ===================================
// ฟังก์ชันลบข้อมูลแขก
// ===================================
async function deleteGuest(guestId, guestName) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ: ${guestName} ออกจากรายการ?`)) {
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/guests/${guestId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            alert(`${guestName} ถูกลบออกจากรายการแล้ว`);
            loadMyGuests(myName); // Reload the list
        } else {
            alert('การลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }

    } catch (error) {
        console.error('Error deleting guest:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}


// ===================================
// ฟังก์ชันโหลดข้อมูลแขกทั้งหมด (All Guests)
// ===================================
async function viewAllGuests(dateValue) {
    const allGuestsListElement = document.getElementById('allGuestsList');
    const allGuestStatus = document.getElementById('all-guest-status');
    allGuestsListElement.innerHTML = ''; // Clear previous list
    allGuestStatus.textContent = '⏳ กำลังโหลดรายชื่อ...';

    try {
        const dateText = dateValue === '3-oct' ? '3 ตุลาคม (วันซ้อม)' : '7 ตุลาคม (วันจริง)';
        const response = await fetch(`${apiBaseUrl}/api/guests/by-date/${dateValue}`);
        const guests = await response.json();

        allGuestStatus.textContent = `✅ แสดงรายชื่อผู้ลงทะเบียนสำหรับวัน ${dateText}`;

        if (guests.length === 0) {
            allGuestsListElement.innerHTML = '<li class="guest-item" style="justify-content: center; font-style: italic; color:#777;">ยังไม่มีผู้ลงทะเบียนในวันนี้</li>';
            return;
        }

        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            // ปรับการแสดงผล: เพิ่มเวลาที่คาดว่าจะมาถึง
            const arrivalTimeText = guest.arrival_time ? ` | ⏱️ ${guest.arrival_time}` : ''; 

            listItem.innerHTML = `
                <span>
                    <strong>${guest.first_name} ${guest.last_name}</strong>
                    <small style="display: block; color: #8e24aa; font-weight: 600;">(มากับ ${guest.host_name}) ${arrivalTimeText}</small>
                </span>
            `;
            allGuestsListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching all guests:', error);
        allGuestStatus.textContent = '❌ ดึงข้อมูลรายชื่อแขกทั้งหมดไม่สำเร็จ';
    }
}

// รอให้ DOM โหลดเสร็จก่อนเรียก initializeLiff()
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing LIFF...');
    
    // ตรวจสอบว่า LIFF SDK โหลดแล้วหรือยัง
    if (typeof liff !== 'undefined') {
        console.log('LIFF SDK found, initializing...');
        initializeLiff();
    } else {
        console.log('LIFF SDK not found, waiting...');
        // Mockup Logic สำหรับทดสอบในเบราว์เซอร์ปกติ
        document.getElementById('login-message').innerHTML = '<p>⚠️ ไม่พบ LIFF SDK กำลังจำลองผู้ใช้สำหรับการทดสอบ</p>';
        myUserId = 'Umockup_line_id_12345';
        myName = 'Test User (Mock)';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-name').textContent = myName;
        document.getElementById('registration-form').addEventListener('submit', handleFormSubmit);
        loadMyGuests(myName); 
        document.getElementById('date').addEventListener('change', (event) => {
             displaySchedule(event.target.value);
        });
    }
});
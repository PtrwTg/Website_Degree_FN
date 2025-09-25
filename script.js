// เปลี่ยน LIFF ID ตรงนี้เป็น LIFF ID ของคุณ
const liffId = '2008162847-jMMzgOn1';
let myUserId = '';

// URL ของ Backend API ของคุณ
const apiBaseUrl = 'https://website-degree-bn.onrender.com';
//const apiBaseUrl = 'http://localhost:5000'; 

// ฟังก์ชันเริ่มต้น LIFF และรับ Profile
async function initializeLiff() {
    try {
        console.log('Initializing LIFF with ID:', liffId);
        
        // 1. เริ่มต้น LIFF
        await liff.init({ liffId: liffId });
        console.log('LIFF initialized successfully');
        
        // 2. ตรวจสอบสถานะการล็อกอิน
        console.log('Checking login status...');
        if (!liff.isLoggedIn()) {
            console.log('User not logged in, redirecting to login...');
            // สั่งล็อกอิน: LIFF จะ Redirect ไปหน้า LINE Login
            liff.login();
        } else {
            console.log('User is logged in, getting profile...');
            // 3. ดึง Profile
            const profile = await liff.getProfile();
            myUserId = profile.userId;
            console.log(`✅ Logged in with userId: ${myUserId}`);
            
            // 4. แสดงรูปโปรไฟล์และชื่อผู้ใช้
            document.getElementById('profile-container').style.display = 'block';
            document.getElementById('profile-picture').src = profile.pictureUrl;
            document.getElementById('display-name').textContent = profile.displayName;

            fetchMyGuests(); // ดึงรายชื่อแขกที่เคยลงทะเบียน
        }
    } catch (err) {
        console.error('🔴 LIFF initialization failed', err);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการเริ่มต้น LIFF';
        if (err && err.message) {
            errorMessage += `\nข้อความ Error: ${err.message}`; // แสดงข้อความ error ที่แท้จริง
        } else {
            errorMessage += '\nโปรดตรวจสอบ LIFF ID และ Endpoint/Callback URL ใน Console';
        }
        alert(errorMessage);
    }
}

// ฟังก์ชันสำหรับส่งข้อมูลการลงทะเบียน
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // ตรวจสอบว่าได้ userId จาก LIFF แล้ว
    if (!myUserId) {
        alert('ไม่สามารถลงทะเบียนได้ โปรดล็อกอินผ่าน LINE App ก่อน (myUserId is missing)');
        return;
    }
    const formData = new FormData(e.target);
    const guestData = {
        line_user_id: myUserId,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('dob'),
        visit_date: formData.get('visitDate'),
    };

    try {
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(guestData)
        });

        if (response.ok) {
            alert('ลงทะเบียนสำเร็จ!');
            document.getElementById('registrationForm').reset();
            fetchMyGuests(); // อัปเดตรายชื่อ
        } else {
            const errorData = await response.json();
            alert(`เกิดข้อผิดพลาดในการลงทะเบียน: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
});

// ฟังก์ชันสำหรับดึงรายชื่อแขกที่ลงทะเบียนโดยผู้ใช้ปัจจุบัน
async function fetchMyGuests() {
    // ตรวจสอบว่าได้ userId จาก LIFF แล้ว
    if (!myUserId) {
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/guests?userId=${myUserId}`);
        const guests = await response.json();
        const guestListElement = document.getElementById('guestList');
        guestListElement.innerHTML = '';
        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            listItem.innerHTML = `
                <span>${guest.first_name} ${guest.last_name} (${guest.visit_date})</span>
                <button class="delete-btn" onclick="deleteGuest('${guest.id}')">ลบ</button>
            `;
            guestListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching guests:', error);
    }
}

// ฟังก์ชันสำหรับลบข้อมูล
async function deleteGuest(guestId) {
    if (confirm('คุณต้องการลบรายชื่อนี้ใช่ไหม?')) {
        try {
            const response = await fetch(`${apiBaseUrl}/guest/${guestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('ลบรายชื่อสำเร็จ!');
                fetchMyGuests(); // อัปเดตรายชื่อ
            } else {
                const errorData = await response.json();
                alert(`เกิดข้อผิดพลาดในการลบ: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error deleting guest:', error);
        }
    }
}

// ฟังก์ชันสำหรับดูรายชื่อแขกทั้งหมดในแต่ละวัน
async function viewAllGuests(date) {
    try {
        const response = await fetch(`${apiBaseUrl}/guests/day/${date}`);
        const guests = await response.json();
        const allGuestsListElement = document.getElementById('allGuestsList');
        allGuestsListElement.innerHTML = '';
        
        if (guests.length === 0) {
            allGuestsListElement.innerHTML = '<li class="guest-item">ยังไม่มีผู้ลงทะเบียนในวันนี้</li>';
            return;
        }

        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            listItem.textContent = `${guest.first_name} ${guest.last_name} (${guest.gender})`;
            allGuestsListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching all guests:', error);
    }
}

// ************************************************************
// ** การเริ่มต้น LIFF ที่รับประกันว่า liff ถูกกำหนดค่าแล้ว **
// ************************************************************

// เราจะรอให้โครงสร้างเว็บ (DOM) โหลดเสร็จก่อน
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page DOM content loaded, attempting to initialize LIFF...');
    
    // ตรวจสอบว่า liff ถูกกำหนดค่าแล้วจริง ๆ ก่อนเรียก initializeLiff()
    if (typeof liff !== 'undefined') {
        initializeLiff();
    } else {
        // หากยังไม่ได้ แสดงว่ามีปัญหา Network หรือ CDN บล็อก
        console.error('LIFF SDK failed to load or is blocked. Check network connection.');
        alert('ไม่สามารถโหลด LINE LIFF SDK ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต.');
    }
});
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error("فشل تحميل المستخدمين");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم تنفيذ الإجراء");
      fetchUsers();
    } catch (err) {
      toast.error("حدث خطأ أثناء العملية");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h4>إدارة المستخدمين</h4>
        <table className="table table-bordered table-striped mt-3">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>رقم التسجيل</th>
              <th>الدور</th>
              <th>الهاتف</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.registration_number}</td>
                <td>{u.role}</td>
                <td>{u.phone}</td>
                <td>{u.is_active ? 'مفعل' : 'معطل'}</td>
                <td>
                  {u.role !== 'admin' && (
                    <>
                      <button
                        className={`btn btn-sm me-2 ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleAction(u.id, u.is_active ? 'deactivate' : 'activate')}
                      >
                        {u.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleAction(u.id, 'delete')}
                      >
                        حذف
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UsersPage;

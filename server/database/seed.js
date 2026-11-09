require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('🌱 Seeding database with demo data...');

  // Clear existing data
  db.exec(`DELETE FROM activity_logs`);
  db.exec(`DELETE FROM notifications`);
  db.exec(`DELETE FROM comments`);
  db.exec(`DELETE FROM tasks`);
  db.exec(`DELETE FROM columns`);
  db.exec(`DELETE FROM boards`);
  db.exec(`DELETE FROM project_members`);
  db.exec(`DELETE FROM projects`);
  db.exec(`DELETE FROM users`);

  // Create demo users
  const password = await bcrypt.hash('password123', 10);

  const alice = db.prepare(`INSERT INTO users (name, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)`).run('Alice Johnson', 'alice', 'alice@taskflow.com', password, 'Frontend Developer & UI/UX Designer');
  const bob = db.prepare(`INSERT INTO users (name, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)`).run('Bob Smith', 'bob', 'bob@taskflow.com', password, 'Backend Developer');
  const carol = db.prepare(`INSERT INTO users (name, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)`).run('Carol Williams', 'carol', 'carol@taskflow.com', password, 'Full Stack Developer');
  const dave = db.prepare(`INSERT INTO users (name, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)`).run('Dave Brown', 'dave', 'dave@taskflow.com', password, 'Project Manager');

  const aliceId = Number(alice.lastInsertRowid);
  const bobId = Number(bob.lastInsertRowid);
  const carolId = Number(carol.lastInsertRowid);
  const daveId = Number(dave.lastInsertRowid);

  console.log('✅ Users created');

  // Projects
  const p1 = db.prepare(`INSERT INTO projects (name, description, owner_id, start_date, due_date, status, visibility, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('E-Commerce Platform', 'Building a modern e-commerce platform with React and Node.js', aliceId, '2026-10-01', '2026-12-31', 'active', 'private', '#6366F1');
  const p2 = db.prepare(`INSERT INTO projects (name, description, owner_id, start_date, due_date, status, visibility, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('Mobile App Redesign', 'Complete redesign of the company mobile application for better UX', bobId, '2026-10-15', '2026-11-30', 'active', 'private', '#8B5CF6');
  const p3 = db.prepare(`INSERT INTO projects (name, description, owner_id, start_date, due_date, status, visibility, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('Data Analytics Dashboard', 'Analytics and reporting dashboard for business intelligence', carolId, '2026-09-01', '2026-11-15', 'active', 'public', '#10B981');

  const p1Id = Number(p1.lastInsertRowid);
  const p2Id = Number(p2.lastInsertRowid);
  const p3Id = Number(p3.lastInsertRowid);

  console.log('✅ Projects created');

  // Members
  const addMember = db.prepare(`INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)`);
  addMember.run(p1Id, aliceId, 'admin');
  addMember.run(p1Id, bobId, 'member');
  addMember.run(p1Id, carolId, 'member');
  addMember.run(p1Id, daveId, 'viewer');
  addMember.run(p2Id, bobId, 'admin');
  addMember.run(p2Id, aliceId, 'member');
  addMember.run(p2Id, daveId, 'member');
  addMember.run(p3Id, carolId, 'admin');
  addMember.run(p3Id, aliceId, 'member');

  console.log('✅ Project members added');

  // Boards
  const b1 = db.prepare(`INSERT INTO boards (project_id, name) VALUES (?, 'Main Board')`).run(p1Id);
  const b2 = db.prepare(`INSERT INTO boards (project_id, name) VALUES (?, 'Main Board')`).run(p2Id);
  const b3 = db.prepare(`INSERT INTO boards (project_id, name) VALUES (?, 'Main Board')`).run(p3Id);

  const b1Id = Number(b1.lastInsertRowid);
  const b2Id = Number(b2.lastInsertRowid);
  const b3Id = Number(b3.lastInsertRowid);

  // Columns
  const addCol = db.prepare(`INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)`);
  const c1_1 = Number(addCol.run(b1Id, 'To Do', 0).lastInsertRowid);
  const c1_2 = Number(addCol.run(b1Id, 'In Progress', 1).lastInsertRowid);
  const c1_3 = Number(addCol.run(b1Id, 'In Review', 2).lastInsertRowid);
  const c1_4 = Number(addCol.run(b1Id, 'Done', 3).lastInsertRowid);

  const c2_1 = Number(addCol.run(b2Id, 'To Do', 0).lastInsertRowid);
  const c2_2 = Number(addCol.run(b2Id, 'In Progress', 1).lastInsertRowid);
  const c2_3 = Number(addCol.run(b2Id, 'In Review', 2).lastInsertRowid);
  const c2_4 = Number(addCol.run(b2Id, 'Done', 3).lastInsertRowid);

  const c3_1 = Number(addCol.run(b3Id, 'To Do', 0).lastInsertRowid);
  const c3_2 = Number(addCol.run(b3Id, 'In Progress', 1).lastInsertRowid);
  const c3_3 = Number(addCol.run(b3Id, 'In Review', 2).lastInsertRowid);
  const c3_4 = Number(addCol.run(b3Id, 'Done', 3).lastInsertRowid);

  console.log('✅ Boards and columns created');

  // Tasks
  const addTask = db.prepare(`INSERT INTO tasks (project_id, column_id, title, description, assigned_to, priority, status, due_date, position, created_by, labels) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const t1 = Number(addTask.run(p1Id, c1_1, 'Setup project repository', 'Initialize Git repository and setup CI/CD pipeline', bobId, 'high', 'todo', '2026-11-20', 0, aliceId, '["backend","setup"]').lastInsertRowid);
  const t2 = Number(addTask.run(p1Id, c1_2, 'Design database schema', 'Create ERD and implement database tables for products, users, orders', bobId, 'urgent', 'in_progress', '2026-11-15', 0, aliceId, '["backend","database"]').lastInsertRowid);
  const t3 = Number(addTask.run(p1Id, c1_2, 'Build authentication API', 'JWT-based auth with register, login, refresh token endpoints', bobId, 'urgent', 'in_progress', '2026-11-18', 1, aliceId, '["backend","auth"]').lastInsertRowid);
  const t4 = Number(addTask.run(p1Id, c1_3, 'Product listing page UI', 'Responsive product grid with filters, search, and sorting', aliceId, 'high', 'in_review', '2026-11-25', 0, aliceId, '["frontend","ui"]').lastInsertRowid);
  const t5 = Number(addTask.run(p1Id, c1_4, 'Project setup & planning', 'Team meeting, requirements gathering, and project roadmap', aliceId, 'medium', 'done', '2026-10-15', 0, aliceId, '["planning"]').lastInsertRowid);
  addTask.run(p1Id, c1_1, 'Shopping cart functionality', 'Add to cart, remove, update quantity, persist cart state', carolId, 'high', 'todo', '2026-12-01', 1, aliceId, '["frontend","feature"]');
  addTask.run(p1Id, c1_1, 'Payment gateway integration', 'Integrate Stripe payment processing with webhooks', bobId, 'urgent', 'todo', '2026-12-10', 2, aliceId, '["backend","payment"]');

  addTask.run(p2Id, c2_1, 'User research & personas', 'Conduct user interviews and create detailed personas', daveId, 'high', 'todo', '2026-11-10', 0, bobId, '["research","ux"]');
  addTask.run(p2Id, c2_2, 'Wireframe design', 'Create low-fidelity wireframes for all main screens', aliceId, 'high', 'in_progress', '2026-11-15', 0, bobId, '["design","ux"]');
  addTask.run(p2Id, c2_4, 'Brand identity review', 'Update color palette, typography, and icon set', aliceId, 'medium', 'done', '2026-10-31', 0, bobId, '["design","branding"]');

  addTask.run(p3Id, c3_1, 'Data pipeline setup', 'Configure ETL pipeline for data ingestion', carolId, 'high', 'todo', '2026-11-20', 0, carolId, '["backend","data"]');
  addTask.run(p3Id, c3_2, 'Dashboard UI components', 'Build reusable chart and metric card components', aliceId, 'medium', 'in_progress', '2026-11-25', 0, carolId, '["frontend","ui"]');

  console.log('✅ Tasks created');

  // Comments
  const addComment = db.prepare(`INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)`);
  addComment.run(t2, aliceId, 'Starting with the users and products tables. Will add the orders schema tomorrow.');
  addComment.run(t2, bobId, 'Looks great! Should we also include a reviews table for product ratings?');
  addComment.run(t2, aliceId, 'Good point! Adding that to the schema now.');
  addComment.run(t3, carolId, 'The refresh token logic needs to handle token rotation for security.');
  addComment.run(t4, aliceId, 'The filter sidebar looks great on desktop. Testing mobile view now.');

  console.log('✅ Comments created');

  // Notifications
  const addNotif = db.prepare(`INSERT INTO notifications (user_id, message, type, related_task_id, related_project_id) VALUES (?, ?, ?, ?, ?)`);
  addNotif.run(bobId, 'You were assigned to "Design database schema"', 'task_assigned', t2, p1Id);
  addNotif.run(aliceId, 'Carol commented on "Build authentication API"', 'comment', t3, p1Id);
  addNotif.run(aliceId, 'You were added to Mobile App Redesign project', 'project_invite', null, p2Id);
  addNotif.run(bobId, 'Task "Design database schema" is due in 3 days', 'deadline', t2, p1Id);

  console.log('✅ Notifications created');

  // Activity logs
  const addActivity = db.prepare(`INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)`);
  addActivity.run(p1Id, t2, aliceId, 'created_task', 'Created task "Design database schema"');
  addActivity.run(p1Id, t2, aliceId, 'assigned_task', 'Assigned task to Bob Smith');
  addActivity.run(p1Id, t3, aliceId, 'created_task', 'Created task "Build authentication API"');
  addActivity.run(p1Id, t5, aliceId, 'completed_task', 'Marked "Project setup & planning" as done');
  addActivity.run(p1Id, t4, aliceId, 'status_change', 'Moved "Product listing page UI" to In Review');

  console.log('✅ Activity logs created');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Email: alice@taskflow.com | Password: password123');
  console.log('  Email: bob@taskflow.com   | Password: password123');
  console.log('  Email: carol@taskflow.com | Password: password123');
  console.log('  Email: dave@taskflow.com  | Password: password123');
}

seed().catch(console.error);

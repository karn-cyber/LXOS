const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
    type: String,
    entityId: mongoose.Schema.Types.ObjectId,
    entityModel: String,
    status: String,
});

const EventSchema = new mongoose.Schema({ title: String });
const ExpenseSchema = new mongoose.Schema({ title: String });

const Approval = mongoose.models.Approval || mongoose.model('Approval', ApprovalSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

async function checkApprovals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const approvals = await Approval.find({ status: 'PENDING' });
        console.log(`Found ${approvals.length} pending approvals`);

        for (const approval of approvals) {
            console.log(`\nChecking Approval ${approval._id}:`);
            console.log(`Type: ${approval.type}, EntityModel: ${approval.entityModel}, EntityId: ${approval.entityId}`);

            let entity = null;
            if (approval.entityModel === 'Event') {
                entity = await Event.findById(approval.entityId);
            } else if (approval.entityModel === 'Expense') {
                entity = await Expense.findById(approval.entityId);
            }

            if (entity) {
                console.log(`✅ Entity Found: ${entity._id} (Title: ${entity.title})`);
            } else {
                console.log(`❌ Entity NOT Found! This is an orphan approval.`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkApprovals();

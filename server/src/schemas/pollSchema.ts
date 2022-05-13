import mongoose from "mongoose";

export const OptionSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true
    },
    votes: {
        type: Number,
    }
})

export const VoterSchema = new mongoose.Schema({
    ticket: {
        type: String,
        required: true
    },
    optionIndex: {
        type: Number
    }
})

export const PollSchema = new mongoose.Schema({
    question: {
        type: String,
    },
    options: {
        type: [OptionSchema]
    },
    voters: {
        type: [VoterSchema]
    },
    isResults: {
        type: Boolean,
        required: true
    }
})

export const VoterModel = mongoose.model('Voter', VoterSchema);
export const OptionModel = mongoose.model('Option', OptionSchema);
export const PollModel = mongoose.model('Poll', PollSchema);
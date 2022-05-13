import { ObjectId } from "mongodb"
import { PollModel } from "../schemas/pollSchema"
import Logger from "../utils/logger"

export interface Option {
    _id: ObjectId
    label: string
    votes: number
}

export class Poll {
    question: string
    options: Array<Option>
    isActive: boolean
    isResults: boolean
    voters: Map<string, number> // user ticket, option index
    dbPoll

    constructor(question?: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
        this.voters = new Map<string, number>();
        this.isActive = false;
        this.isResults = false;
    }

    public async resetPoll(): Promise<void> {
        this.question = null;
        this.options = []
        this.voters = new Map<string, number>();
        this.isActive = false;
        this.isResults = false;
        await PollModel.deleteMany({});
        await PollModel.create({
            question: null,
            options: [],
            voters: [],
            isResults: false
        });
        this.dbPoll = await PollModel.findOne();
        console.log('reset POLL',this.dbPoll);
    }

    public async loadPoll(): Promise<void> {
        const size = await PollModel.count();
        // await PollModel.deleteMany({});
        if (size != 1) {
            await PollModel.create({
                question: this.question,
                options: [],
                voters: [],
                isResults: false
            });
        }
        this.dbPoll = await PollModel.findOne();
        this.question = this.dbPoll.question;
        this.options = this.dbPoll.options.map(opt => {return { _id: opt._id.toString(), label: opt.label, votes: opt.votes }});
        this.dbPoll.voters.forEach(opt => this.voters.set(opt.ticket, opt.optionIndex));
        this.isResults = this.dbPoll.isResults;
        console.log('current POLL',this.question, this.options, this.voters);
    }

    public async setPoll(question: string, options: Array<Option>): Promise<boolean> {
        if (!this.dbPoll) await this.loadPoll();
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0 || this.isActive) return false;
        this.question = question;
        this.dbPoll.question = question;
        this.dbPoll.options = []
        options.forEach(opt => this.dbPoll.options.push(opt));
        this.options = this.dbPoll.options.map(opt => {return { _id: opt._id.toString(), label: opt.label, votes: opt.votes }});
        await this.dbPoll.save();
        return true;
    }

    public async voteOption(optionIndex: number, ticket: string): Promise<Option> {
        if (this.voters.has(ticket) || !this.isActive) return null;
        if (optionIndex >= this.options.length || optionIndex < 0) return null;
        const option: Option = this.options[optionIndex];
        console.log('poll.ts', optionIndex, ticket, option);
        this.options[optionIndex] = {...option, votes: option.votes+1};
        this.voters.set(ticket, optionIndex);

        this.dbPoll.voters.push({ticket, optionIndex});
        console.log('dbPoll', option._id);
        // update options database
        const optionDb = await this.dbPoll.options.id(option._id);
        console.log('dbPoll', this.dbPoll.voters);
        optionDb.votes = this.options[optionIndex].votes;
        await this.dbPoll.save(err => {
            if (!err) return;
            Logger.error(err);
            throw 'Error saving vote to database';
        });
        return this.options[optionIndex];
    }

    public async publishResults(resultsStatus: boolean): Promise<boolean> {
        this.isResults = resultsStatus;
        this.dbPoll.isResults = resultsStatus;
        await this.dbPoll.save(err => {
            if (!err) return;
            Logger.error(err);
            throw 'Error saving published status to database';
        });
        return this.isResults;
    }

    public getJSON() {
        return {
            question: this.question, 
            options: this.options, 
            isActive: this.isActive,
            isResults: this.isResults,
            voters: Array.from(this.voters.entries())
                .map(vote => {return {ticket: vote[0], optionIndex: vote[1]}})
        };
    }
}
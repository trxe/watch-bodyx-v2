import { PollModel } from "../schemas/pollSchema"

export interface Option {
    label: string
    votes: number
}

export class Poll {
    question: string
    options: Array<Option>
    isActive: boolean
    voters: Map<string, number> // user ticket, option label
    dbPoll

    constructor(question?: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
        this.voters = new Map<string, number>();
        this.loadPoll();
    }

    public async loadPoll(): Promise<void> {
        const size = await PollModel.count();
        if (size != 1) {
            await PollModel.create({
                question: this.question,
                options: [],
                voters: []
            });
        }
        this.dbPoll = await PollModel.findOne();
        console.log('i\'m tired', this.dbPoll);
    }

    public async setPoll(question: string, options: Array<Option>): Promise<boolean> {
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0 || this.isActive) return false;
        this.question = question;
        this.dbPoll.question = question;
        this.options = options;
        this.dbPoll.options = []
        options.forEach(opt => this.dbPoll.options.push(opt));
        await this.dbPoll.save();
        // console.log('help', this.dbPoll.options)
        return true;
    }

    public voteOption(optionIndex: number, ticket: string): Option {
        if (this.voters.has(ticket) || !this.isActive) return null;
        if (optionIndex >= this.options.length || optionIndex < 0) return null;
        const option: Option = this.options[optionIndex];
        this.options[optionIndex] = {...option, votes: option.votes+1};
        this.voters.set(ticket, optionIndex);
        return this.options[optionIndex];
    }

    public getJSON() {
        return {
            question: this.question, 
            options: this.options, 
            voters: Array.from(this.voters.entries())
                .map(vote => {return {voter: vote[0], optionIndex: vote[1]}})
        };
    }
}
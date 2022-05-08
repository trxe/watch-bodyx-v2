export interface Option {
    label: string
    votes: number
}

export class Poll {
    question: string
    options: Array<Option>
    isActive: boolean
    voters: Map<string, string> // user ticket, option label

    constructor(question: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
        this.voters = new Map<string, string>();
    }

    public setQuestion(question: string) {
        this.question = question;
    }

    public setOptions(options: Array<Option>): boolean {
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0 || this.isActive) return false;
        this.options = options;
        return true;
    }

    public voteOption(optionIndex: number, ticket: string): Option {
        if (this.voters.has(ticket) || !this.isActive) return null;
        if (optionIndex >= this.options.length || optionIndex < 0) return null;
        const option: Option = this.options[optionIndex];
        this.options[optionIndex] = {...option, votes: option.votes+1};
        this.voters.set(ticket, option.label);
        return this.options[optionIndex];
    }

    public getJSON() {
        return {
            question: this.question, 
            options: this.options, 
            voters: Array.from(this.voters.entries())
        };
    }
}
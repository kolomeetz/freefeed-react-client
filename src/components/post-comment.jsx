import React from 'react';
import Textarea from 'react-textarea-autosize';
import _ from 'lodash';
import classnames from 'classnames';

import throbber16 from '../../assets/images/throbber-16.gif';
import {preventDefault, confirmFirst} from '../utils';
import {READMORE_STYLE_COMPACT} from '../utils/frontend-preferences-options';
import {commentReadmoreConfig} from '../utils/readmore-config';

import PieceOfText from './piece-of-text';
import Expandable from './expandable';
import UserName from './user-name';
import TimeDisplay from './time-display';


export default class PostComment extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editText: this.props.editText || ''
    };
    this.commentTextArea = null;
  }

  handleChange = (event) => {
    this.setState({
      editText: event.target.value
    });
  }

  openAnsweringComment = (event) => {
    event.preventDefault();
    if (this.props.openAnsweringComment && event.button === 0) {
      const withCtrl = event.ctrlKey || event.metaKey;
      if (!withCtrl && this.props.hideType) {
        return;
      }
      const answerText = (event.ctrlKey || event.metaKey) ? _.repeat('^', this.props.backwardNumber) : '@' + this.props.user.username;
      this.props.openAnsweringComment(answerText);
    }
  }

  setCaretToTextEnd = (event) => {
    const input = event.target;

    setTimeout(() => {
      if (typeof input.selectionStart === 'number') {
        input.selectionStart = input.selectionEnd = input.value.length;
      } else if (input.createTextRange !== undefined) {
        input.focus();
        const range = input.createTextRange();
        range.collapse(false);
        range.select();
      }
    }, 0);
  }

  updateCommentingText = () => {
    if (this.props.updateCommentingText) {
      this.props.updateCommentingText(this.props.id, this.commentTextArea.value);
    }
  }

  checkSave = (event) => {
    const isEnter = event.keyCode === 13;
    const isShiftPressed = event.shiftKey;
    if (isEnter && !isShiftPressed) {
      event.preventDefault();
      event.target.blur();
      setTimeout(this.saveComment, 0);
    }
  }

  saveComment = () => {
    if (!this.props.isSaving) {
      this.props.saveEditingComment(this.props.id, this.commentTextArea.value);
    }
  }

  focus() {
    if (this.commentTextArea) {
      this.commentTextArea.focus();
    }
  }

  componentWillReceiveProps(newProps) {
    const wasCommentJustSaved = this.props.isSaving && !newProps.isSaving;
    const wasThereNoError = !newProps.errorString;
    const isItSinglePostAddingComment = newProps.isSinglePost;
    const shouldClearText = (wasCommentJustSaved && wasThereNoError && isItSinglePostAddingComment);
    if (shouldClearText) {
      this.setState({editText: ''});
    }
    if ((this.props.editText || '') !== newProps.editText) {
      this.setState({editText: newProps.editText});
    }
  }

  renderBody() {
    if (this.props.hideType) {
      return <div className="comment-body">{this.props.body}</div>;
    }

    if (this.props.isEditing) {
      return (
        <div className="comment-body">
          <div>
            <Textarea
              autoFocus={!this.props.isSinglePost}
              ref={(el) => this.commentTextArea = el}
              className="comment-textarea"
              value={this.state.editText}
              onFocus={this.setCaretToTextEnd}
              onChange={this.handleChange}
              onKeyDown={this.checkSave}
              onBlur={this.updateCommentingText}
              minRows={2}
              maxRows={10}
              maxLength="1500"/>
          </div>
          {this.props.isSinglePost ? (
            <span>
              <button className="btn btn-default btn-xs comment-post" onClick={this.saveComment}>Comment</button>
            </span>
          ) : (
            <span>
              <button className="btn btn-default btn-xs comment-post" onClick={this.saveComment}>Post</button>
              <a className="comment-cancel" onClick={preventDefault(()=>this.props.toggleEditingComment(this.props.id))}>Cancel</a>
            </span>
          )}
          {this.props.isSaving ? (
            <span className="comment-throbber">
              <img width="16" height="16" src={throbber16}/>
            </span>
          ) : false}
          {this.props.errorString ? (
            <span className="comment-error">{this.props.errorString}</span>
          ) : false}
        </div>
      );
    }

    const authorAndButtons = (<span>
            {' -'}&nbsp;
            <UserName user={this.props.user}/>
            {this.props.isEditable ? (
              <span>
                {' '}(<a onClick={preventDefault(()=>this.props.toggleEditingComment(this.props.id))}>edit</a>
                &nbsp;|&nbsp;
                <a onClick={confirmFirst(()=>this.props.deleteComment(this.props.id))}>delete</a>)
              </span>
            ) : (this.props.isDeletable && this.props.isModeratingComments) ? (
              <span>
                {' '}(<a onClick={confirmFirst(()=>this.props.deleteComment(this.props.id))}>delete</a>)
              </span>
            ) : false}</span>);

    return (
      <div className="comment-body">
        <Expandable expanded={this.props.readMoreStyle === READMORE_STYLE_COMPACT || this.props.isSinglePost || this.props.isExpanded}
                    bonusInfo={authorAndButtons}
                    config={commentReadmoreConfig}>
          <PieceOfText
            text={this.props.body}
            readMoreStyle={this.props.readMoreStyle}
            highlightTerms={this.props.highlightTerms}
            userHover={{
              hover: username => this.props.highlightComment(username),
              leave: this.props.clearHighlightComment
            }}
            arrowHover={{
              hover: arrows => this.props.highlightArrowComment(arrows),
              leave: this.props.clearHighlightComment
            }}
          />
          {authorAndButtons}
        </Expandable>
      </div>
    );
  }

  render() {
    const className = classnames({
      'comment': true,
      'highlighted': this.props.highlighted,
      'omit-bubble': this.props.omitBubble,
      'is-hidden': !!this.props.hideType,
    });

    return (
      <div className={className} data-author={this.props.isEditing ? '' : this.props.user.username}>
        <TimeDisplay className="comment-time" timeStamp={+this.props.createdAt} timeAgoInTitle={true}>
          <a
            className={`comment-icon fa ${this.props.omitBubble ? 'feed-comment-dot' : 'fa-comment-o'}`}
            id={`comment-${this.props.id}`}
            href={`${this.props.entryUrl}#comment-${this.props.id}`}
            onClick={this.openAnsweringComment}></a>
        </TimeDisplay>
        {this.renderBody()}
      </div>
    );
  }
}
